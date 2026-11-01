import Anthropic from '@anthropic-ai/sdk'
import { Pool } from 'pg'
import { AgentContext, CanonicalAsset } from './schemas/canonicalAsset'
import { fetchAADataTool }         from './tools/fetchAAData'
import { fetchLandDataTool }       from './tools/fetchLandData'
import { fetchDocumentsTool }      from './tools/fetchDocuments'
import { fetchUnclaimedTool }      from './tools/fetchUnclaimed'
import { fetchMCADataTool }        from './tools/fetchMCAData'
import { normaliseDataTool }       from './tools/normaliseData'
import { deduplicateDataTool }     from './tools/deduplicateData'
import { enrichWithAITool }        from './tools/enrichWithAI'
import { injectToDatabaseTool }    from './tools/injectToDatabase'
import { auditLogger }             from '../services/auditLogger'
import { logRunStep }              from './queue/agentQueue'

const MODEL     = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
const MAX_STEPS = 20 // model turns; safety limit

let anthropic: Anthropic | undefined
function client(): Anthropic {
  anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}

// ─────────────────────────────────────────────
// Design note
// The model only decides *which step runs next*. Every identity value
// (userId, consentId, PAN, name, state, runId) and every data payload
// (raw API responses, asset arrays) lives server-side in RunState and is
// never taken from tool input. Previously the model was asked to echo
// whole datasets back as tool arguments: a hallucinated userId could write
// into another user's account, and an empty or invented array went straight
// to the database. Tool results returned to the model are counts only, so
// account numbers, transactions and nominee names are not sent to the LLM
// or stored unencrypted in agent_run_steps.
// ─────────────────────────────────────────────

type SourceKey = 'setu_aa' | 'surepass' | 'digilocker' | 'iepf_epfo' | 'mca21'

const FETCH_TOOL_SOURCE: Record<string, SourceKey> = {
  fetch_aa_data:   'setu_aa',
  fetch_land_data: 'surepass',
  fetch_documents: 'digilocker',
  fetch_unclaimed: 'iepf_epfo',
  fetch_mca_data:  'mca21',
}

const SOURCE_ALIASES: Record<string, SourceKey> = {
  setu_aa: 'setu_aa', aa: 'setu_aa',
  surepass: 'surepass', land: 'surepass',
  digilocker: 'digilocker',
  iepf_epfo: 'iepf_epfo', iepf: 'iepf_epfo', epfo: 'iepf_epfo',
  mca21: 'mca21', mca: 'mca21',
}

const NO_INPUT = { type: 'object' as const, properties: {} }

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'fetch_aa_data',
    description:
      'Fetches bank accounts, mutual funds, equity, NPS and insurance from Setu Account ' +
      'Aggregator for the current user using their active consent. Returns counts only.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fiTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional FI types to keep: DEPOSIT, MUTUAL_FUND, EQUITY, NPS, INSURANCE_POLICIES',
        },
      },
    },
  },
  {
    name: 'fetch_land_data',
    description: 'Searches Surepass land records for the current user using their profile name and state. Returns counts only.',
    input_schema: NO_INPUT,
  },
  {
    name: 'fetch_documents',
    description: 'Fetches the current user\'s DigiLocker documents (land records, insurance, vehicle RC). Returns counts only.',
    input_schema: {
      type: 'object' as const,
      properties: {
        docTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional document types: AADHAAR, PAN, LAND_RECORD, INSURANCE, RC',
        },
      },
    },
  },
  {
    name: 'fetch_unclaimed',
    description: 'Searches IEPF (unclaimed dividends/shares) and EPFO (provident fund) for the current user. Returns counts only.',
    input_schema: NO_INPUT,
  },
  {
    name: 'fetch_mca_data',
    description: 'Searches MCA21 for company directorships and shareholdings linked to the current user. Returns counts only.',
    input_schema: NO_INPUT,
  },
  {
    name: 'normalise_data',
    description: 'Converts everything fetched so far into the canonical asset schema. Call after all fetches are done.',
    input_schema: NO_INPUT,
  },
  {
    name: 'deduplicate_data',
    description: 'Merges assets reported by more than one source. Call after normalise_data.',
    input_schema: NO_INPUT,
  },
  {
    name: 'enrich_with_ai',
    description: 'Adds risk level, liquidity score, anomaly flags and summaries to each asset. Call after deduplicate_data.',
    input_schema: NO_INPUT,
  },
  {
    name: 'inject_to_database',
    description: 'Saves the enriched assets and triggers net-worth, nominee and dormancy checks. Final step.',
    input_schema: NO_INPUT,
  },
]

const AGENT_SYSTEM_PROMPT = `
You are the AssetMap data orchestration agent. You run the pipeline that
collects, normalises, deduplicates, enriches and stores an Indian user's
asset data. The server already holds the user's identity and every
intermediate result; tools take no identifiers and return counts only.

Order:
1. Call each fetch tool for the sources listed as requested. Call them in
   the same turn so they run in parallel.
2. normalise_data
3. deduplicate_data
4. enrich_with_ai
5. inject_to_database

A fetch that fails or is skipped is not fatal: carry on with the rest.
Once inject_to_database has succeeded, reply with a one-paragraph summary
of what was processed, which sources failed and any anomalies, then stop.
`.trim()

interface FetchOutcome {
  status: 'success' | 'failed' | 'skipped'
  error?: string
  count?: number
}

interface RunState {
  rawData:          Partial<Record<SourceKey, any>>
  fetches:          Partial<Record<SourceKey, FetchOutcome>>
  normalised:       CanonicalAsset[] | null
  deduped:          CanonicalAsset[] | null
  enriched:         CanonicalAsset[] | null
  injected:         { created: number; updated: number } | null
  anomalies:        number
  enrichFallback:   boolean
  tokensUsed:       number
  aiCalls:          number
  stepsCompleted:   string[]
  stepsFailed:      string[]
}

class StepError extends Error {}

function requestedSources(context: AgentContext): Set<SourceKey> {
  const set = new Set<SourceKey>()
  for (const s of context.sourcesToFetch) {
    const key = SOURCE_ALIASES[s.toLowerCase()]
    if (key) set.add(key)
  }
  return set
}

function countOf(source: SourceKey, result: any): number {
  switch (source) {
    case 'setu_aa':    return result?.accounts?.length ?? 0
    case 'surepass':   return result?.records?.length ?? 0
    case 'digilocker': return result?.documents?.length ?? 0
    case 'iepf_epfo':  return (result?.iepf?.records?.length ?? 0) +
                              (result?.epfo?.accounts?.length ?? 0) +
                              (result?.epfo?.pension?.length ?? 0)
    case 'mca21':      return result?.companies?.length ?? 0
  }
}

/** Run one fetch tool. Inputs come from the context, never from the model. */
async function runFetch(
  pool: Pool,
  context: AgentContext,
  state: RunState,
  source: SourceKey,
  toolInput: any,
): Promise<FetchOutcome> {
  const { userId, userProfile } = context
  const skip = (error: string): FetchOutcome => ({ status: 'skipped', error })

  if (!requestedSources(context).has(source)) {
    return skip(`${source} is not in sourcesToFetch for this run`)
  }

  let result: any
  switch (source) {
    case 'setu_aa':
      if (!context.consentId) return skip('No active AA consent for this user')
      result = await fetchAADataTool(pool, {
        userId,
        consentId: context.consentId,
        fiTypes:   Array.isArray(toolInput?.fiTypes) && toolInput.fiTypes.length ? toolInput.fiTypes : undefined,
      })
      break
    case 'surepass':
      if (!userProfile.state) return skip('User state unknown — land search needs a state')
      result = await fetchLandDataTool(pool, {
        userId,
        ownerName: userProfile.name,
        state:     userProfile.state,
        stateCode: userProfile.stateCode,
        district:  userProfile.district,
      })
      break
    case 'digilocker':
      result = await fetchDocumentsTool(pool, {
        userId,
        docTypes: Array.isArray(toolInput?.docTypes) && toolInput.docTypes.length ? toolInput.docTypes : undefined,
      })
      break
    case 'iepf_epfo':
      if (!userProfile.pan) return skip('PAN not available')
      result = await fetchUnclaimedTool(pool, { userId, pan: userProfile.pan, name: userProfile.name })
      break
    case 'mca21':
      if (!userProfile.pan) return skip('PAN not available')
      result = await fetchMCADataTool(pool, { userId, pan: userProfile.pan })
      break
  }

  state.rawData[source] = result
  // New raw data invalidates anything derived from the old set
  state.normalised = state.deduped = state.enriched = null

  if (result?.skipped) return skip(result.error ?? `${source} not available`)

  return result?.success === false
    ? { status: 'failed', error: result.error, count: countOf(source, result) }
    : { status: 'success', count: countOf(source, result) }
}

/** Execute a tool by name and return the summary sent back to the model. */
async function executeTool(
  pool: Pool,
  context: AgentContext,
  state: RunState,
  toolName: string,
  toolInput: any,
): Promise<Record<string, unknown>> {
  const fetchSource = FETCH_TOOL_SOURCE[toolName]
  if (fetchSource) {
    const outcome = await runFetch(pool, context, state, fetchSource, toolInput)
    state.fetches[fetchSource] = outcome
    if (outcome.status === 'failed') throw new StepError(outcome.error ?? `${fetchSource} fetch failed`)
    return { source: fetchSource, ...outcome }
  }

  switch (toolName) {
    case 'normalise_data': {
      state.normalised = await normaliseDataTool(context.userId, state.rawData)
      state.deduped = state.enriched = null
      return {
        success: true,
        count:   state.normalised.length,
        classes: [...new Set(state.normalised.map(a => a.assetClass))],
      }
    }

    case 'deduplicate_data': {
      if (!state.normalised) throw new StepError('Call normalise_data first')
      state.deduped  = await deduplicateDataTool(pool, context.userId, state.normalised, context.runId)
      state.enriched = null
      return {
        success:     true,
        beforeDedup: state.normalised.length,
        afterDedup:  state.deduped.length,
        removed:     state.normalised.length - state.deduped.length,
      }
    }

    case 'enrich_with_ai': {
      if (!state.deduped) throw new StepError('Call deduplicate_data first')
      const result = await enrichWithAITool(pool, context.userId, state.deduped, context.runId, {
        enrichWithAI:    context.options.enrichWithAI,
        detectAnomalies: context.options.detectAnomalies,
      })
      state.enriched       = result.assets
      state.anomalies      = result.anomaliesDetected
      state.enrichFallback = result.usedFallback
      state.tokensUsed    += result.tokensUsed
      state.aiCalls       += result.aiCalls
      return {
        success:           true,
        enriched:          result.assets.length,
        anomaliesDetected: result.anomaliesDetected,
        usedDefaults:      result.usedFallback,
      }
    }

    case 'inject_to_database': {
      if (!state.enriched) throw new StepError('Call enrich_with_ai first')
      if (state.injected) return { success: true, alreadyInjected: true, ...state.injected }
      state.injected = await injectToDatabaseTool(pool, context.userId, context.runId, state.enriched, context)
      return { success: true, ...state.injected }
    }

    default:
      throw new StepError(`Unknown tool: ${toolName}`)
  }
}

/** Execute + log one step. Never throws for step-level failures. */
async function runStep(
  pool: Pool,
  context: AgentContext,
  state: RunState,
  toolName: string,
  toolInput: any,
): Promise<{ summary: Record<string, unknown>; isError: boolean }> {
  await pool.query(`UPDATE agent_runs SET current_step = $2 WHERE id = $1`, [context.runId, toolName])

  const started = Date.now()
  let summary: Record<string, unknown>
  let isError = false
  let errorMessage: string | undefined

  try {
    summary = await executeTool(pool, context, state, toolName, toolInput)
  } catch (err: any) {
    isError      = true
    errorMessage = err?.message ?? String(err)
    summary      = { success: false, tool: toolName, error: errorMessage }
    console.error(`[Agent] Tool ${toolName} failed:`, errorMessage)
    // A database failure while saving is not recoverable by the model
    if (toolName === 'inject_to_database' && !(err instanceof StepError)) throw err
  }

  const skipped = summary.status === 'skipped'
  ;(isError ? state.stepsFailed : state.stepsCompleted).push(toolName)

  await logRunStep(pool, {
    runId:         context.runId,
    userId:        context.userId,
    stepName:      toolName,
    status:        isError ? 'failed' : skipped ? 'skipped' : 'completed',
    inputSummary:  { keys: Object.keys(toolInput ?? {}) },
    outputSummary: summary,
    durationMs:    Date.now() - started,
    errorMessage,
  })

  return { summary, isError }
}

/**
 * Finish whatever the model left undone (it stopped early, hit the step
 * limit, or refused). Fetched data is never discarded because the model
 * ended its turn.
 */
async function completePipeline(pool: Pool, context: AgentContext, state: RunState): Promise<void> {
  for (const [tool, source] of Object.entries(FETCH_TOOL_SOURCE)) {
    if (!state.fetches[source]) await runStep(pool, context, state, tool, {})
  }
  if (!state.normalised) await runStep(pool, context, state, 'normalise_data', {})
  if (!state.deduped)    await runStep(pool, context, state, 'deduplicate_data', {})
  if (!state.enriched)   await runStep(pool, context, state, 'enrich_with_ai', {})
  if (!state.injected)   await runStep(pool, context, state, 'inject_to_database', {})
}

export async function runOrchestrationAgent(
  pool: Pool,
  context: AgentContext
): Promise<{ success: boolean; recordsProcessed: number; runId: string }> {

  const startTime = Date.now()

  await pool.query(`
    UPDATE agent_runs
    SET status = 'running', started_at = NOW(), current_step = 'initialising',
        error_message = NULL, error_stack = NULL
    WHERE id = $1
  `, [context.runId])

  const state: RunState = {
    rawData: {}, fetches: {},
    normalised: null, deduped: null, enriched: null, injected: null,
    anomalies: 0, enrichFallback: false, tokensUsed: 0, aiCalls: 0,
    stepsCompleted: [], stepsFailed: [],
  }

  const sources = [...requestedSources(context)]
  const userMessage = `
Process all financial and physical assets for the current user.

Trigger: ${context.triggerType}
Requested sources: ${sources.join(', ') || 'none'}
AA consent available: ${context.consentId ? 'yes' : 'no'}
PAN available: ${context.userProfile.pan ? 'yes' : 'no'}
State known (for land search): ${context.userProfile.state ? 'yes' : 'no'}
Force refresh: ${context.options.forceRefresh}
Is estate case: ${context.options.isEstateCase}
`.trim()

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }]

  try {
    for (let turn = 0; turn < MAX_STEPS && !state.injected; turn++) {
      const response = await client().messages.create({
        model:      MODEL,
        max_tokens: 4096,
        system:     AGENT_SYSTEM_PROMPT,
        tools:      AGENT_TOOLS,
        messages,
      })

      state.tokensUsed += response.usage.input_tokens + response.usage.output_tokens
      state.aiCalls++

      // Only continue on tool_use. end_turn means done; max_tokens / refusal /
      // anything else would leave a tool_use without a tool_result in the
      // history and the next request would 400 — fall through to the
      // deterministic completion instead.
      if (response.stop_reason !== 'tool_use') {
        if (response.stop_reason !== 'end_turn') {
          console.warn(`[Agent] Model stopped with ${response.stop_reason}; completing pipeline deterministically`)
        }
        break
      }

      messages.push({ role: 'assistant', content: response.content })

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      // Fetches are independent — run them concurrently; pipeline steps
      // run afterwards in the order the model asked for them.
      const results = new Map<string, Anthropic.ToolResultBlockParam>()
      const toResult = (block: Anthropic.ToolUseBlock, r: { summary: Record<string, unknown>; isError: boolean }) =>
        results.set(block.id, {
          type:        'tool_result',
          tool_use_id: block.id,
          content:     JSON.stringify(r.summary),
          is_error:    r.isError,
        })

      const fetchBlocks = toolUses.filter(b => FETCH_TOOL_SOURCE[b.name])
      const otherBlocks = toolUses.filter(b => !FETCH_TOOL_SOURCE[b.name])

      const fetchResults = await Promise.all(
        fetchBlocks.map(b => runStep(pool, context, state, b.name, b.input))
      )
      fetchBlocks.forEach((b, i) => toResult(b, fetchResults[i]))

      for (const b of otherBlocks) {
        toResult(b, await runStep(pool, context, state, b.name, b.input))
      }

      // All results go back in one user message, in the original order
      messages.push({ role: 'user', content: toolUses.map(b => results.get(b.id)!) })
    }

    if (!state.injected) {
      await completePipeline(pool, context, state)
    }
    if (!state.injected) {
      throw new Error('Pipeline did not reach inject_to_database')
    }

    const sourcesFetched = Object.entries(state.fetches)
      .filter(([, o]) => o?.status === 'success')
      .map(([s]) => s)
    const anyFetchFailed = Object.values(state.fetches).some(o => o?.status === 'failed')
    const status = anyFetchFailed || state.enrichFallback ? 'partial' : 'completed'
    const normalisedCount = state.normalised?.length ?? 0
    const dedupedCount    = state.deduped?.length ?? 0

    await pool.query(`
      UPDATE agent_runs SET
        status               = $2,
        completed_at         = NOW(),
        duration_ms          = $3,
        records_created      = $4,
        records_updated      = $5,
        records_deduplicated = $6,
        anomalies_detected   = $7,
        ai_tokens_used       = $8,
        ai_calls_made        = $9,
        sources_fetched      = $10,
        steps_completed      = $11,
        steps_failed         = $12,
        current_step         = 'done'
      WHERE id = $1
    `, [
      context.runId,
      status,
      Date.now() - startTime,
      state.injected.created,
      state.injected.updated,
      normalisedCount - dedupedCount,
      state.anomalies,
      state.tokensUsed,
      state.aiCalls,
      sourcesFetched,
      state.stepsCompleted,
      state.stepsFailed,
    ])

    const recordsProcessed = state.injected.created + state.injected.updated

    await auditLogger.log({
      userId:     context.userId,
      action:     'AGENT_RUN_COMPLETED',
      entityType: 'agent_run',
      entityId:   context.runId,
      metadata:   {
        trigger:    context.triggerType,
        status,
        recordsProcessed,
        tokensUsed: state.tokensUsed,
        durationMs: Date.now() - startTime,
      }
    })

    return { success: true, recordsProcessed, runId: context.runId }

  } catch (err: any) {
    await pool.query(`
      UPDATE agent_runs SET
        status        = 'failed',
        completed_at  = NOW(),
        duration_ms   = $2,
        error_message = $3,
        error_stack   = $4,
        ai_tokens_used = $5,
        ai_calls_made  = $6,
        steps_completed = $7,
        steps_failed    = $8
      WHERE id = $1
    `, [
      context.runId,
      Date.now() - startTime,
      err?.message ?? String(err),
      err?.stack ?? null,
      state.tokensUsed,
      state.aiCalls,
      state.stepsCompleted,
      state.stepsFailed,
    ]).catch(updateErr => console.error('[Agent] Could not record failure:', updateErr.message))

    console.error('[Agent] Orchestration failed:', err)
    throw err
  }
}
