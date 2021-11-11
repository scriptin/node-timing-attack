const http = require('http');
const Statistics = require('statistics.js');

const MAX_LEN = 32;
const N_OBSERVATIONS = 20;
const REPORT_EVERY = 2 * N_OBSERVATIONS * MAX_LEN;

async function makeRequest(key) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: { 'api-key': key },
    };

    const tStart = process.hrtime();
    const req = http.request(options, res => {
      const tDiff = process.hrtime(tStart);
      res.on('data', data => {
        resolve([data.toString(), tDiff]);
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}


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
 * @param arr {number[]}
 * @return {number}
 */
function harmonicMean(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum = sum + (1 / arr[i]);
  }

  return arr.length/sum;
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
 * @param ts {TimeSpan[]}
 * @return {TimeSpan}
 */
function measure(ts) {
  const w = 10;
  const stats = new Statistics([], {});
  const numbers = ts.map(timeSpanToNumber);
  const l = stats.quantile(numbers, (50 - w)/100);
  const r = stats.quantile(numbers, (50 + w)/100);
  const mean = stats.mean([l, r]);
  return numberToTimeSpan(mean);
}

/**
 * @param t {TimeSpan}
 * @return {string}
 */
function timeToString(t) {
  return t[0].toString().padStart(3, ' ') + '.' + t[1].toString().padStart(9, '0');
}

/**
 * @type {{
 *   [key: number]: {
 *     times: TimeSpan[],
 *     count: number,
 *   }
 * }}
 */
const lengths = {};

let totalCount = 0;

/**
 * @type {{
 *   [key: number]: number
 * }}
 */
const topPlaces = {};

async function guessLength() {
  const randomLen = Math.floor(Math.random() * MAX_LEN) + 1;
  const dummyKey = '0'.repeat(randomLen);

  const [data, tDiff] = await makeRequest(dummyKey);

  const times = lengths[randomLen]?.times ?? [];
  const count = lengths[randomLen]?.count ?? 0;
  lengths[randomLen] = {
    times: [tDiff, ...times].slice(0, N_OBSERVATIONS),
    count: count + 1,
  };
  totalCount += 1;

  if (totalCount % REPORT_EVERY === 0) {
    const top = Object.keys(lengths)
      .map(len => [len, measure(lengths[len].times), lengths[len].count])
      .sort((a, b) => compare(a[1], b[1]));
    const [topLen] = top[0];
    if (topPlaces[topLen] == null) {
      topPlaces[topLen] = 0;
    }
    topPlaces[topLen] += 1;

    // const report = top.map(([len, measure, count]) => [
    //     len.toString().padStart(2, '0'),
    //     timeToString(measure),
    //     count,
    //   ].join(' '))
    //   .join("\n");

    const report = Object.keys(topPlaces).map(l => [l, topPlaces[l]])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(row => row[0].padStart(2, ' ') + ': ' + row[1] + ' time(s)')
      .join("\n");
    console.log(report + "\n");
  }

  setTimeout(() => guessLength(), 0);
}

guessLength();
