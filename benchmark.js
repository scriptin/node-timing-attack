const { makeRequest } = require('./lib/request');
const { compareStringsSlowly } = require('./lib/compare');
const { toBigInt } = require('./lib/hrtime');

const N_RUNS = 10000;

/**
 * @param f {() => Promise<[data: any, timeDiff: BigInt]>}
 * @param nRuns {number}
 * @return {Promise<BigInt>} Avg. run time
 */
async function benchmark(f, nRuns) {
  let timeTotal = 0n;
  for (let i = 0; i < nRuns; i++) {
    const [, timeDiff] = await f();
    timeTotal += timeDiff;
  }
  return Promise.resolve(timeTotal / BigInt(nRuns));
}

async function runAllBenchmarks() {
  const N_STRINGS = 100;
  const MAX_STRING_LEN = 32;
  const randomStrings = Array.from(Array(N_STRINGS))
    .map(() => '0'.repeat(Math.trunc(Math.random() * MAX_STRING_LEN) + 1));

  const stringComparison = async () => {
    const s1 = randomStrings[Math.round(Math.random() * N_STRINGS)];
    const s2 = randomStrings[Math.round(Math.random() * N_STRINGS)];
    const start = process.hrtime();
    const result = s1 === s2;
    const diff = process.hrtime(start);
    return Promise.resolve([result, toBigInt(diff)]);
  };
  const stringComparisonBenchmark = await benchmark(stringComparison, N_RUNS);

  const slowStringComparison = async () => {
    const s1 = randomStrings[Math.trunc(Math.random() * N_STRINGS)];
    const s2 = randomStrings[Math.trunc(Math.random() * N_STRINGS)];
    const start = process.hrtime();
    const result = await compareStringsSlowly(s1, s2);
    const diff = process.hrtime(start);
    return Promise.resolve([result, toBigInt(diff)]);
  };
  const slowStringComparisonBenchmark = await benchmark(slowStringComparison, N_RUNS);

  const requestBenchmark = await benchmark(makeRequest, N_RUNS);

  console.log(`String comparison:      ${stringComparisonBenchmark.toString().padStart(10, ' ')}ns`);
  console.log(`Slow string comparison: ${slowStringComparisonBenchmark.toString().padStart(10, ' ')}ns`);
  console.log(`HTTP request:           ${requestBenchmark.toString().padStart(10, ' ')}ns`);
}

runAllBenchmarks();
