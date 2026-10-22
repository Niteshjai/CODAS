import assert from 'node:assert/strict';
import test from 'node:test';
import { WealthManagerResponseSchema } from './wealthManagerTransform.js';

test('wealth-manager response schema rejects an incomplete payload', () => {
  const result = WealthManagerResponseSchema.safeParse({});

  assert.equal(result.success, false);
});
