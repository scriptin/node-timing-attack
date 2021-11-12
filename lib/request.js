const http = require('http');

/**
 * @param t {ReturnType<HRTime>}
 * @return {BigInt}
 */
function toBigInt(t) {
  return BigInt(Math.trunc(t[0]).toString() + Math.trunc(t[1]).toString().padStart(9, '0'));
}

/**
 * Make a request and measure its round trip time
 * @param key
 * @return {Promise<[data: string, timeDiff: BigInt]>}
 */
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
