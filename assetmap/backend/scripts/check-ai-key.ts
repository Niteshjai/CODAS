// Verify ANTHROPIC_API_KEY works before deploying: `npm run ai:check`.
// Makes one tiny request per model tier the app uses and prints a pass/fail line each.
// Exits 1 if any tier fails. Never prints the key.
import { getClaude, CLAUDE_MODELS, describeClaudeError } from '../src/ai/claudeClient';

async function main(): Promise<number> {
  const claude = getClaude();
  if (!claude) {
    console.error('ANTHROPIC_API_KEY is not set — AI features will run in fallback mode.');
    return 1;
  }
  let failed = 0;
  for (const [tier, model] of Object.entries(CLAUDE_MODELS)) {
    try {
      const res = await claude.messages.create({
        model,
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      });
      console.log(`✓ ${tier.padEnd(8)} ${model} — ${res.usage.input_tokens + res.usage.output_tokens} tokens`);
    } catch (err) {
      failed++;
      console.error(`✗ ${tier.padEnd(8)} ${model} — ${describeClaudeError(err)}`);
    }
  }
  return failed ? 1 : 0;
}

main().then((code) => process.exit(code));
