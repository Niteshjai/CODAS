import 'dotenv/config';

import { runner } from './testFramework';
import { pool, kvStore, connectRedis } from '../src/db/connection';

// Import all test suites
import { registerTotpServiceTests } from './auth/totpService.test';
import { registerOtpServiceTests } from './auth/otpService.test';
import { registerBackupCodeServiceTests } from './auth/backupCodeService.test';
import { registerTrustedDeviceServiceTests } from './auth/trustedDeviceService.test';
import { registerTwoFactorAuthTests } from './auth/twoFactorAuth.test';
import { registerAlertServiceTests } from './services/alertService.test';
import { registerOtpGuardAndStoreTests } from './services/otpGuardAndStore.test';
import { registerSessionStoreTests } from './services/sessionStore.test';
import { registerAuditLoggerTests } from './services/auditLogger.test';
import { registerLoanEligibilityTests } from './services/loanEligibility.test';
import { registerEncryptionAndValidatorsTests } from './utils/encryptionAndValidators.test';
import { registerNetWorthTrackerTests } from './services/netWorthTracker.test';
import { registerInsuranceGapFinderTests } from './services/insuranceGapFinder.test';
import { registerDormantAndNomineeTests } from './services/dormantAndNominee.test';
import { registerWillBuilderTests } from './services/willBuilder.test';
import { registerFamilyVaultTests } from './services/familyVault.test';
import { registerAssetReportTests } from './services/assetReport.test';
import { registerAaTransactionsTests } from './services/aaTransactions.test';
import { registerClientIpTests } from './services/clientIp.test';
import { registerSupportServiceTests } from './services/supportService.test';

import { registerAccountSettingsTests } from './services/accountSettings.test';
import { registerNotificationCenterTests } from './services/notificationCenter.test';
import { registerSpendAiTests } from './services/spendAi.test';
import { registerAgentRunsTests } from './services/agentRuns.test';
import { Queue } from 'bullmq';
import { getRedisConnection } from '../src/workers/redisConnection';
import { setAgentQueueForTests, AgentQueueLike } from '../src/agent/agentRuns';
async function main() {
  const startTime = Date.now();

  // Use real Redis when it's reachable (as the app does), so Lua-script paths (token rotation,
  // counters) are exercised; in development connectRedis falls back to the memory store.
  await connectRedis().catch(() => false);

  // Code under test (AA fetch, land, unclaimed) queues agent runs. Send them to a throwaway queue
  // so a running agent worker never picks up a test user's job; it is obliterated at the end.
  const agentTestQueue = new Queue(`asset-orchestration-test-run-${process.pid}`, {
    connection: getRedisConnection(), skipVersionCheck: true,
  } as any);
  agentTestQueue.on('error', () => {});
  setAgentQueueForTests(agentTestQueue as unknown as AgentQueueLike);

  // Register all suites
  registerTotpServiceTests();
  registerOtpServiceTests();
  registerBackupCodeServiceTests();
  registerTrustedDeviceServiceTests();
  registerTwoFactorAuthTests();
  registerAlertServiceTests();
  registerOtpGuardAndStoreTests();
  registerSessionStoreTests();
  registerAuditLoggerTests();
  registerLoanEligibilityTests();
  registerEncryptionAndValidatorsTests();
  registerNetWorthTrackerTests();
  registerInsuranceGapFinderTests();
  registerDormantAndNomineeTests();
  registerWillBuilderTests();
  registerFamilyVaultTests();
  registerAssetReportTests();
  registerAaTransactionsTests();
  registerClientIpTests();
  registerSupportServiceTests();
  registerAccountSettingsTests();
  registerNotificationCenterTests();
  registerSpendAiTests();
  registerAgentRunsTests();

  // Execute all tests
  const { totalPassed, totalFailed, suites } = await runner.run();
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary Report
  console.log('\n======================================================');
  console.log('                   TEST RESULTS SUMMARY               ');
  console.log('======================================================');
  
  suites.forEach(s => {
    const statusIcon = s.failed === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(` ${statusIcon}  ${s.suiteName.padEnd(50)} (${s.passed}/${s.total}) in ${s.durationMs}ms`);
  });

  console.log('------------------------------------------------------');
  console.log(` Total Suites:  ${suites.length}`);
  console.log(` Total Tests:   ${totalPassed + totalFailed}`);
  console.log(` \x1b[32mPassed:        ${totalPassed}\x1b[0m`);
  if (totalFailed > 0) {
    console.log(` \x1b[31mFailed:        ${totalFailed}\x1b[0m`);
  } else {
    console.log(` Failed:        0`);
  }
  console.log(` Time Elapsed:  ${totalDuration}s`);
  console.log('======================================================\n');

  // Teardown connections cleanly
  try {
    setAgentQueueForTests(null);
    // Bounded: with Redis unreachable BullMQ would wait for it indefinitely
    await Promise.race([
      agentTestQueue.obliterate({ force: true }).catch(() => {}).then(() => agentTestQueue.close()).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  } catch (e) {}
  try {
    await pool.end();
    if (typeof (kvStore as any).quit === 'function') {
      await (kvStore as any).quit();
    } else if (typeof (kvStore as any).disconnect === 'function') {
      await (kvStore as any).disconnect();
    }
  } catch (e) {}

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n\x1b[31mFATAL TEST ERROR:\x1b[0m', err);
  process.exit(1);
});
