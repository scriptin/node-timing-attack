const http = require('http');

/**
 * @param t {ReturnType<HRTime>}
 * @return {BigInt}
 */
function toBigInt(t) {
  return BigInt(Math.trunc(t[0]).toString() + Math.trunc(t[1]).toString().padStart(9, '0'));
}

/**
 * Make a request and measure its round trip time (RTT) in nanoseconds
 * @param key {string|undefined} API key to attach as a request header
 * @return {Promise<[data: string, timeDiff: BigInt]>} `data` - response body, string; `timeDiff` - RTT, nanoseconds
 */
async function makeRequest(key) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: key ? { 'api-key': key } : undefined,
    };

    const tStart = process.hrtime();
    const req = http.request(options, res => {
      const tDiff = process.hrtime(tStart);
      res.on('data', data => {
        resolve([data.toString(), toBigInt(tDiff)]);
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}

module.exports = { makeRequest };
