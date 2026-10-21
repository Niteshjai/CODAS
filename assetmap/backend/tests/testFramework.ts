// Lightweight, dependency-free test framework for backend services

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export interface SuiteStats {
  suiteName: string;
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
  results: TestResult[];
}

class Expectation<T> {
  private actual: T;
  private isNot: boolean;

  constructor(actual: T, isNot: boolean = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.isNot);
  }

  toBe(expected: any) {
    const pass = this.actual === expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`);
    }
  }

  toEqual(expected: any) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    const pass = actualStr === expectedStr;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${actualStr} ${this.isNot ? 'NOT to equal' : 'to equal'} ${expectedStr}`);
    }
  }

  toBeTruthy() {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be truthy' : 'to be truthy'}`);
    }
  }

  toBeFalsy() {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be falsy' : 'to be falsy'}`);
    }
  }

  toBeNull() {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be null' : 'to be null'}`);
    }
  }

  toBeDefined() {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected value ${this.isNot ? 'to be undefined' : 'to be defined'}`);
    }
  }

  toBeGreaterThan(expected: number) {
    const pass = (this.actual as unknown as number) > expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be greater than' : 'to be greater than'} ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected: number) {
    const pass = (this.actual as unknown as number) >= expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be greater than or equal to' : 'to be greater than or equal to'} ${expected}`);
    }
  }

  toBeLessThan(expected: number) {
    const pass = (this.actual as unknown as number) < expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be less than' : 'to be less than'} ${expected}`);
    }
  }

  toContain(item: any) {
    let pass = false;
    if (typeof this.actual === 'string') {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(item)}`);
    }
  }

  toHaveLength(expectedLen: number) {
    const len = (this.actual as any)?.length;
    const pass = len === expectedLen;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected length ${len} ${this.isNot ? 'NOT to be' : 'to be'} ${expectedLen}`);
    }
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

export interface TestCase {
  name: string;
  fn: () => Promise<void> | void;
}

export interface TestSuite {
  name: string;
  beforeAllFns: (() => Promise<void> | void)[];
  afterAllFns: (() => Promise<void> | void)[];
  tests: TestCase[];
}

export class TestRunner {
  private currentSuite: TestSuite | null = null;
  private suites: TestSuite[] = [];

  describe(name: string, fn: () => void) {
    const suite: TestSuite = {
      name,
      beforeAllFns: [],
      afterAllFns: [],
      tests: []
    };
    this.currentSuite = suite;
    this.suites.push(suite);
    fn();
    this.currentSuite = null;
  }

  it(name: string, fn: () => Promise<void> | void) {
    if (!this.currentSuite) {
      throw new Error('it() must be called inside describe()');
    }
    this.currentSuite.tests.push({ name, fn });
  }

  test(name: string, fn: () => Promise<void> | void) {
    this.it(name, fn);
  }

  beforeAll(fn: () => Promise<void> | void) {
    if (!this.currentSuite) throw new Error('beforeAll() must be inside describe()');
    this.currentSuite.beforeAllFns.push(fn);
  }

  afterAll(fn: () => Promise<void> | void) {
    if (!this.currentSuite) throw new Error('afterAll() must be inside describe()');
    this.currentSuite.afterAllFns.push(fn);
  }

  async run(): Promise<{ totalPassed: number; totalFailed: number; suites: SuiteStats[] }> {
    const stats: SuiteStats[] = [];
    let totalPassed = 0;
    let totalFailed = 0;

    console.log('\n======================================================');
    console.log('         FINANCIAL OS — SERVICE TEST RUNNER           ');
    console.log('======================================================\n');

    for (const suite of this.suites) {
      const suiteStart = Date.now();
      console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${suite.name}\x1b[0m`);
      
      // Execute beforeAll hooks
      for (const beforeFn of suite.beforeAllFns) {
        await beforeFn();
      }

      const suiteStat: SuiteStats = {
        suiteName: suite.name,
        passed: 0,
        failed: 0,
        total: suite.tests.length,
        durationMs: 0,
        results: []
      };

      for (const test of suite.tests) {
        const testStart = Date.now();
        try {
          await test.fn();
          const durationMs = Date.now() - testStart;
          suiteStat.passed++;
          totalPassed++;
          suiteStat.results.push({ suiteName: suite.name, testName: test.name, passed: true, durationMs });
          console.log(`  \x1b[32m✔\x1b[0m ${test.name} \x1b[90m(${durationMs}ms)\x1b[0m`);
        } catch (err: any) {
          const durationMs = Date.now() - testStart;
          suiteStat.failed++;
          totalFailed++;
          suiteStat.results.push({ suiteName: suite.name, testName: test.name, passed: false, error: err, durationMs });
          console.log(`  \x1b[31m✖\x1b[0m ${test.name} \x1b[90m(${durationMs}ms)\x1b[0m`);
          console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
          if (err.stack) {
            const stackLines = err.stack.split('\n').slice(1, 3).join('\n    ');
            console.log(`    \x1b[90m${stackLines}\x1b[0m`);
          }
        }
      }

      // Execute afterAll hooks
      for (const afterFn of suite.afterAllFns) {
        try {
          await afterFn();
        } catch (err: any) {
          console.error(`  \x1b[33mWarning in afterAll hook:\x1b[0m ${err.message}`);
        }
      }

      suiteStat.durationMs = Date.now() - suiteStart;
      stats.push(suiteStat);
    }

    return { totalPassed, totalFailed, suites: stats };
  }
}

export const runner = new TestRunner();
export const describe = runner.describe.bind(runner);
export const it = runner.it.bind(runner);
export const test = runner.test.bind(runner);
export const beforeAll = runner.beforeAll.bind(runner);
export const afterAll = runner.afterAll.bind(runner);
