import { CLAUDE_MODELS, generateJSON } from '../ai/claudeClient'

interface AIScore {
  nameMatchScore:  number
  locationScore:   number
  timePeriodScore: number
  ownershipScore:  number
  reasons:         string[]
  concerns:        string[]
}

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    nameMatchScore:  { type: 'integer' },
    locationScore:   { type: 'integer' },
    timePeriodScore: { type: 'integer' },
    ownershipScore:  { type: 'integer' },
    reasons:         { type: 'array', items: { type: 'string' } },
    concerns:        { type: 'array', items: { type: 'string' } },
  },
  required: ['nameMatchScore', 'locationScore', 'timePeriodScore', 'ownershipScore', 'reasons', 'concerns'],
  additionalProperties: false,
}

// Keep each component inside its documented range so the total stays 0–100
const clamp = (v: unknown, max: number) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)))

export interface ConfidenceScore {
  overall:         number          // 0–100
  label:           'very_likely' | 'likely' | 'possible' | 'unlikely'
  nameMatchScore:  number          // 0–40 points
  locationScore:   number          // 0–30 points
  timePeriodScore: number          // 0–20 points
  ownershipScore:  number          // 0–10 points
  reasons:         string[]
  concerns:        string[]
}

export async function scoreConfidence(
  searchInput: {
    ancestorName:    string
    relationship:    string
    state:           string
    district?:       string
    village?:        string
    approximateDecade?: string
  },
  result: {
    ownerName:      string
    surveyNumber:   string
    village:        string
    district:       string
    state:          string
    currentOwner?:  string
    matchedVariant: string
    matchType:      string
    areaAcres?:     number
    mutationHistory?:any[]
  }
): Promise<ConfidenceScore> {

  const prompt = `
You are analysing whether a land record match is likely to be
the property a user is searching for.

WHAT THE USER IS SEARCHING FOR:
- Ancestor name: ${searchInput.ancestorName}
- Relationship: ${searchInput.relationship}
- State: ${searchInput.state}
- District: ${searchInput.district ?? 'not specified'}
- Village: ${searchInput.village ?? 'not specified'}
- Approximate era: ${searchInput.approximateDecade ?? 'unknown'}

WHAT THE LAND RECORD SHOWS:
- Owner name in record: ${result.ownerName}
- Name variant that matched: ${result.matchedVariant} (${result.matchType})
- Survey number: ${result.surveyNumber}
- Village: ${result.village}
- District: ${result.district}
- State: ${result.state}
- Current owner: ${result.currentOwner ?? 'same as record owner'}
- Area: ${result.areaAcres ? result.areaAcres + ' acres' : 'unknown'}
- Mutations: ${result.mutationHistory?.length ?? 0} recorded changes

Score this match. Return these fields:
{
  "nameMatchScore": <0-40>,
  "locationScore": <0-30>,
  "timePeriodScore": <0-20>,
  "ownershipScore": <0-10>,
  "reasons": ["<why this is likely a match>"],
  "concerns": ["<what doesn't quite fit>"]
}

SCORING GUIDE:
nameMatchScore:
  40 = exact match
  30-39 = same name, minor spelling variant
  20-29 = phonetic match or abbreviation
  10-19 = partial match (first or last name only)
  0-9 = weak or questionable match

locationScore:
  30 = exact district AND village match
  20-29 = district match, village approximate
  10-19 = state match, district approximate
  0-9 = only state matches

timePeriodScore:
  20 = mutation history consistent with family's time period
  10-19 = plausible timing
  0-9 = inconsistent or no timing data

ownershipScore:
  10 = current owner name suggests family member (heir)
  5 = current owner is government (possible encumbrance)
  0 = sold to unknown third party (harder to recover)

Keep reasons and concerns to 1-3 items each. Be specific.
`.trim()

  try {
    const ai = await generateJSON<AIScore>({
      model:     CLAUDE_MODELS.fast,
      prompt,
      schema:    SCORE_SCHEMA,
      maxTokens: 4000,
      effort:    'low',
    })
    const scored = {
      nameMatchScore:  clamp(ai.nameMatchScore, 40),
      locationScore:   clamp(ai.locationScore, 30),
      timePeriodScore: clamp(ai.timePeriodScore, 20),
      ownershipScore:  clamp(ai.ownershipScore, 10),
    }
    const overall = scored.nameMatchScore + scored.locationScore +
                    scored.timePeriodScore + scored.ownershipScore

    const label = overall >= 75 ? 'very_likely' :
                  overall >= 55 ? 'likely'      :
                  overall >= 35 ? 'possible'    : 'unlikely'

    return {
      overall,
      label,
      ...scored,
      reasons:         ai.reasons  ?? [],
      concerns:        ai.concerns ?? [],
    }

  } catch (err) {
    // Fallback: simple rule-based scoring if AI fails
    const nameScore     = result.matchType === 'exact' ? 35 : 20
    const locationScore = (result.district?.toLowerCase() === searchInput.district?.toLowerCase()) ? 25 : 10
    const overall       = nameScore + locationScore + 10 + 5

    return {
      overall,
      label:           overall >= 55 ? 'likely' : 'possible',
      nameMatchScore:  nameScore,
      locationScore,
      timePeriodScore: 10,
      ownershipScore:  5,
      reasons:         ['Name and location approximately match'],
      concerns:        ['AI scoring unavailable — manual verification recommended'],
    }
  }
}
