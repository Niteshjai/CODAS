import type Anthropic from '@anthropic-ai/sdk'
import type { PoolClient } from 'pg'
import { AgentContext, CanonicalAsset, SourceKey } from './schemas/canonicalAsset'
import { loadAASnapshots }         from './loaders/aaSnapshots'
import { loadLandRecords }         from './loaders/landRecords'
import { loadUnclaimed }           from './loaders/unclaimed'
import { fetchDocumentsTool }      from './tools/fetchDocuments'
import { fetchMCADataTool }        from './tools/fetchMCAData'
import { normaliseDataTool }       from './tools/normaliseData'
import { deduplicateDataTool }     from './tools/deduplicateData'
import { enrichWithAITool }        from './tools/enrichWithAI'
import { injectToDatabaseTool, InjectResult } from './tools/injectToDatabase'
import { aiAvailable, anthropic, noteAiError } from './ai'
import { config } from '../config'

const MAX_TURNS = 20 // model turns; safety limit

// ─────────────────────────────────────────────
// Design note
// Claude is optional. When available it only decides *which step runs next*;
// every identity value and data payload lives server-side in RunState and is
// never taken from tool input. Tool results sent to the model are counts only.
// Any Claude problem (no key, rejected key, overloaded, timeout, network) ends
// the model loop and completePipeline() runs the remaining steps
// deterministically: load → normalise → dedup → enrich (defaults) → inject.
// A run never fails because of AI.
//
// Sources are read from the backend's tables (the backend owns every Setu,
// land-registry and unclaimed-asset call). DigiLocker and MCA21 call external
// APIs and only run when AGENT_ENABLE_EXTERNAL_SOURCES=true.
// ─────────────────────────────────────────────

const FETCH_TOOL_SOURCE: Record<string, SourceKey> = {
  fetch_aa_data:   'setu_aa',
  fetch_land_data: 'surepass',
  fetch_unclaimed: 'iepf_epfo',
  fetch_documents: 'digilocker',
  fetch_mca_data:  'mca21',
}

const NO_INPUT = { type: 'object' as const, properties: {} }

const FETCH_TOOLS: Record<SourceKey, Anthropic.Tool> = {
  setu_aa: {
    name: 'fetch_aa_data',
    description: 'Loads the user\'s stored Account Aggregator accounts (bank, mutual funds, equity, NPS, insurance) for their active consents. Returns counts only.',
    input_schema: NO_INPUT,
  },
  surepass: {
    name: 'fetch_land_data',
    description: 'Loads the user\'s stored land records. Returns counts only.',
    input_schema: NO_INPUT,
  },
  iepf_epfo: {
    name: 'fetch_unclaimed',
    description: 'Loads the unclaimed assets (IEPF, EPFO, IRDAI) found by the user\'s unclaimed-asset searches. Returns counts only.',
    input_schema: NO_INPUT,
  },
  digilocker: {
    name: 'fetch_documents',
    description: 'Fetches the current user\'s DigiLocker documents (land records, insurance, vehicle RC). Returns counts only.',
    input_schema: NO_INPUT,
  },
  mca21: {
    name: 'fetch_mca_data',
    description: 'Searches MCA21 for company directorships and shareholdings linked to the current user. Returns counts only.',
    input_schema: NO_INPUT,
  },
}

const PIPELINE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'normalise_data',
    description: 'Converts everything loaded so far into the canonical asset schema. Call after all fetches are done.',
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
    description: 'Saves the enriched assets. Final step.',
    input_schema: NO_INPUT,
  },
]

const AGENT_SYSTEM_PROMPT = `
You are the AssetMap data orchestration agent. You run the pipeline that
collects, normalises, deduplicates, enriches and stores an Indian user's
asset data. The server already holds the user's identity and every
intermediate result; tools take no identifiers and return counts only.

Order:
1. Call every fetch tool you were given, in the same turn so they run in parallel.
2. normalise_data
3. deduplicate_data
4. enrich_with_ai
5. inject_to_database

A fetch that fails or is skipped is not fatal: carry on with the rest.
Once inject_to_database has succeeded, reply with a one-sentence summary and stop.
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
  injected:         InjectResult | null
  anomalies:        number
  enrichFallback:   boolean
  /** Claude failed (or was unavailable) at some point in this run */
  aiFailed:         boolean
  tokensUsed:       number
  aiCalls:          number
  stepsCompleted:   string[]
  stepsFailed:      string[]
}

export interface RunOutcome {
  status:              'completed' | 'partial'
  aiUsed:              boolean
  recordsCreated:      number
  recordsUpdated:      number
  recordsDeduplicated: number
  recordsDeactivated:  number
  anomaliesDetected:   number
  tokensUsed:          number
  aiCalls:             number
  sourcesFetched:      string[]
  sourcesFailed:       string[]
  stepsCompleted:      string[]
  stepsFailed:         string[]
}

class StepError extends Error {}

function countOf(source: SourceKey, result: any): number {
  switch (source) {
    case 'setu_aa':    return result?.accounts?.length ?? 0
    case 'surepass':   return result?.records?.length ?? 0
    case 'digilocker': return result?.documents?.length ?? 0
    case 'iepf_epfo':  return (result?.iepf?.records?.length ?? 0) +
                              (result?.epfo?.accounts?.length ?? 0) +
                              (result?.epfo?.pension?.length ?? 0) +
                              (result?.irdai?.records?.length ?? 0)
    case 'mca21':      return result?.companies?.length ?? 0
  }
}

/** Run one source load. Inputs come from the context, never from the model. */
async function runFetch(
  db: PoolClient,
  context: AgentContext,
  state: RunState,
  source: SourceKey,
): Promise<FetchOutcome> {
  const { userId, userProfile } = context
  const skip = (error: string): FetchOutcome => ({ status: 'skipped', error })

  if (!context.sourcesToFetch.includes(source)) {
    return skip(`${source} is not enabled for this run`)
  }

  let result: any
  switch (source) {
    case 'setu_aa':
      result = await loadAASnapshots(db, userId)
      break
    case 'surepass':
      result = await loadLandRecords(db, userId)
      break
    case 'iepf_epfo':
      result = await loadUnclaimed(db, userId)
      break
    case 'digilocker':
      result = await fetchDocumentsTool(db, { userId })
      break
    case 'mca21':
      if (!userProfile.pan) return skip('PAN not available')
      result = await fetchMCADataTool(db, { userId, pan: userProfile.pan })
      break
  }

  if (result?.skipped) return skip(result.error ?? `${source} not available`)

  state.rawData[source] = result
  // New raw data invalidates anything derived from the old set
  state.normalised = state.deduped = state.enriched = null

  return result?.success === false
    ? { status: 'failed', error: result.error, count: countOf(source, result) }
    : { status: 'success', count: countOf(source, result) }
}

/** Execute a tool by name and return the summary sent back to the model. */
async function executeTool(
  db: PoolClient,
  context: AgentContext,
  state: RunState,
  toolName: string,
): Promise<Record<string, unknown>> {
  const fetchSource = FETCH_TOOL_SOURCE[toolName]
  if (fetchSource) {
    let outcome: FetchOutcome
    try {
      outcome = await runFetch(db, context, state, fetchSource)
    } catch (err: any) {
      // Record the failure so completePipeline does not retry it and the source is
      // never treated as loaded (no deactivation)
      outcome = { status: 'failed', error: `${fetchSource} load failed: ${String(err?.message ?? err).slice(0, 200)}` }
    }
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
      state.deduped  = await deduplicateDataTool(db, context.userId, state.normalised, context.runId)
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
      const result = await enrichWithAITool(db, context.userId, state.deduped, {
        enrichWithAI:    context.options.enrichWithAI,
        detectAnomalies: context.options.detectAnomalies,
        aiAllowed:       !state.aiFailed,
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
      const loadedSources = (Object.entries(state.fetches) as Array<[SourceKey, FetchOutcome]>)
        .filter(([, o]) => o.status === 'success')
        .map(([s]) => s)
      state.injected = await injectToDatabaseTool(db, context.userId, context.runId, state.enriched, {
        loadedSources,
        detectAnomalies: context.options.detectAnomalies,
      })
      return { success: true, ...state.injected }
    }

    default:
      throw new StepError(`Unknown tool: ${toolName}`)
  }
}

async function logRunStep(
  db: PoolClient,
  params: {
    runId: string; userId: string; stepName: string
    status: 'completed' | 'failed' | 'skipped'
    outputSummary: unknown; durationMs: number; errorMessage?: string
  },
): Promise<void> {
  await db.query(`
    INSERT INTO agent_run_steps (
      run_id, user_id, step_name, status,
      input_summary, output_summary, duration_ms, error_message
    ) VALUES ($1, $2, $3, $4, '{}'::jsonb, $5, $6, $7)
  `, [
    params.runId, params.userId, params.stepName, params.status,
    JSON.stringify(params.outputSummary ?? {}), params.durationMs, params.errorMessage ?? null,
  ])
}

/** Execute + log one step. Never throws for step-level failures. */
async function runStep(
  db: PoolClient,
  context: AgentContext,
  state: RunState,
  toolName: string,
): Promise<{ summary: Record<string, unknown>; isError: boolean }> {
  await db.query(`UPDATE agent_runs SET current_step = $2 WHERE id = $1`, [context.runId, toolName])

  const started = Date.now()
  let summary: Record<string, unknown>
  let isError = false
  let errorMessage: string | undefined

  try {
    summary = await executeTool(db, context, state, toolName)
  } catch (err: any) {
    // A database failure while saving is not recoverable here: fail the attempt (retried)
    if (toolName === 'inject_to_database' && !(err instanceof StepError)) throw err
    isError      = true
    errorMessage = String(err?.message ?? err).slice(0, 500)
    summary      = { success: false, tool: toolName, error: errorMessage }
    console.warn(`[Agent] run ${context.runId}: step ${toolName} failed: ${errorMessage}`)
  }

  const skipped = summary.status === 'skipped'
  ;(isError ? state.stepsFailed : state.stepsCompleted).push(toolName)

  await logRunStep(db, {
    runId:         context.runId,
    userId:        context.userId,
    stepName:      toolName,
    status:        isError ? 'failed' : skipped ? 'skipped' : 'completed',
    outputSummary: summary,
    durationMs:    Date.now() - started,
    errorMessage,
  })

  return { summary, isError }
}

/**
 * Finish whatever the model left undone (no AI, AI error, early stop, step
 * limit). Fetched data is never discarded because the model ended its turn.
 */
async function completePipeline(db: PoolClient, context: AgentContext, state: RunState): Promise<void> {
  for (const [tool, source] of Object.entries(FETCH_TOOL_SOURCE)) {
    if (context.sourcesToFetch.includes(source) && !state.fetches[source]) {
      await runStep(db, context, state, tool)
    }
  }
  if (!state.normalised) await runStep(db, context, state, 'normalise_data')
  if (!state.deduped)    await runStep(db, context, state, 'deduplicate_data')
  if (!state.enriched)   await runStep(db, context, state, 'enrich_with_ai')
  if (!state.injected)   await runStep(db, context, state, 'inject_to_database')
}

/** Let Claude drive the step order. Returns when the model is done or Claude fails. */
async function modelLoop(db: PoolClient, context: AgentContext, state: RunState): Promise<void> {
  const tools = [
    ...context.sourcesToFetch.map(s => FETCH_TOOLS[s]),
    ...PIPELINE_TOOLS,
  ]
  const userMessage = `
Process all financial and physical assets for the current user.

Trigger: ${context.triggerType}
Fetch tools to call: ${tools.filter(t => FETCH_TOOL_SOURCE[t.name]).map(t => t.name).join(', ') || 'none'}
`.trim()

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }]

  for (let turn = 0; turn < MAX_TURNS && !state.injected; turn++) {
    if (!aiAvailable()) { state.aiFailed = true; return }

    let response: Anthropic.Message
    try {
      response = await anthropic().messages.create({
        model:      config.routingModel(),
        max_tokens: 1024,
        system:     AGENT_SYSTEM_PROMPT,
        tools,
        messages,
      })
    } catch (err) {
      noteAiError(err, 'routing')
      state.aiFailed = true
      return
    }

    state.tokensUsed += response.usage.input_tokens + response.usage.output_tokens
    state.aiCalls++

    // Only continue on tool_use. Anything else would leave a tool_use without a
    // tool_result in the history; the deterministic completion takes over instead.
    if (response.stop_reason !== 'tool_use') {
      if (response.stop_reason !== 'end_turn') {
        console.warn(`[Agent] run ${context.runId}: model stopped with ${response.stop_reason}; completing deterministically`)
      }
      return
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    // Fetches are independent — run them concurrently; pipeline steps run
    // afterwards in the order the model asked for them.
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

    const fetchResults = await Promise.all(fetchBlocks.map(b => runStep(db, context, state, b.name)))
    fetchBlocks.forEach((b, i) => toResult(b, fetchResults[i]))

    for (const b of otherBlocks) {
      toResult(b, await runStep(db, context, state, b.name))
    }

    messages.push({ role: 'user', content: toolUses.map(b => results.get(b.id)!) })
  }
}

/**
 * Run the pipeline for one attempt on the run's dedicated connection.
 * Throws only for non-AI failures (database errors while saving, …); the
 * caller owns the agent_runs status updates and the audit log.
 */
export async function runOrchestrationAgent(db: PoolClient, context: AgentContext): Promise<RunOutcome> {
  const state: RunState = {
    rawData: {}, fetches: {},
    normalised: null, deduped: null, enriched: null, injected: null,
    anomalies: 0, enrichFallback: false, aiFailed: false, tokensUsed: 0, aiCalls: 0,
    stepsCompleted: [], stepsFailed: [],
  }

  if (aiAvailable()) {
    await modelLoop(db, context, state)
  } else {
    state.aiFailed = true
  }

  if (!state.injected) await completePipeline(db, context, state)
  if (!state.injected) throw new Error('Pipeline did not reach inject_to_database')

  const fetches = Object.entries(state.fetches) as Array<[SourceKey, FetchOutcome]>
  const sourcesFetched = fetches.filter(([, o]) => o.status === 'success').map(([s]) => s)
  const sourcesFailed  = fetches.filter(([, o]) => o.status === 'failed').map(([s]) => s)

  return {
    status:              sourcesFailed.length > 0 || state.enrichFallback ? 'partial' : 'completed',
    aiUsed:              state.aiCalls > 0,
    recordsCreated:      state.injected.created,
    recordsUpdated:      state.injected.updated,
    recordsDeduplicated: (state.normalised?.length ?? 0) - (state.deduped?.length ?? 0),
    recordsDeactivated:  state.injected.deactivated,
    anomaliesDetected:   state.injected.anomalies,
    tokensUsed:          state.tokensUsed,
    aiCalls:             state.aiCalls,
    sourcesFetched,
    sourcesFailed,
    stepsCompleted:      state.stepsCompleted,
    stepsFailed:         state.stepsFailed,
  }
}
