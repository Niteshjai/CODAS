import Anthropic from '@anthropic-ai/sdk';

// Shared Claude access for every AI feature. One place to set models, timeouts and
// response validation, so a retired model or malformed reply can't fail silently per-feature.

export const CLAUDE_MODELS = {
  // Tiers preserved from the original call sites (retired IDs replaced with current ones)
  standard: 'claude-sonnet-5-5',
  fast: 'claude-haiku-5-5',
} as const;

let client: Anthropic | null | undefined;

/** Lazily built so a missing ANTHROPIC_API_KEY never crashes module import or startup. */
export function getClaude(): Anthropic | null {
  if (client === undefined) {
    client = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          timeout: 30_000, // SDK default is 10 min; these are interactive / worker-path calls
          maxRetries: 2,   // retries 408/409/429/5xx and connection errors
        })
      : null;
  }
  return client;
}

export class ClaudeUnavailableError extends Error {}

/**
 * Single request whose text output is constrained to `schema` (structured outputs), so
 * the reply always parses. Throws on refusal, truncation, or a missing API key; callers
 * keep their own non-AI fallbacks.
 */
export async function generateJSON<T>(params: {
  model: string;
  prompt: string;
  schema: Record<string, unknown>;
  system?: string;
  maxTokens: number;
  effort?: 'low' | 'medium' | 'high';
}): Promise<T> {
  const claude = getClaude();
  if (!claude) throw new ClaudeUnavailableError('ANTHROPIC_API_KEY is not configured');

  const response = await claude.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    ...(params.system ? { system: params.system } : {}),
    output_config: {
      format: { type: 'json_schema', schema: params.schema },
      ...(params.effort ? { effort: params.effort } : {}),
    },
    messages: [{ role: 'user', content: params.prompt }],
  });

  if (response.stop_reason === 'refusal') {
    throw new ClaudeUnavailableError('Claude declined the request');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new ClaudeUnavailableError('Claude response was truncated (max_tokens)');
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return JSON.parse(text) as T;
}

/** Log-safe description: status/class only, never request or response bodies. */
export function describeClaudeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) return `Anthropic API ${err.status ?? 'error'}: ${err.name}`;
  return (err as Error)?.message ?? 'unknown error';
}
