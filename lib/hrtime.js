/**
 * @param t {ReturnType<HRTime>}
 * @return {BigInt}
 */
function toBigInt(t) {
  return BigInt(Math.trunc(t[0]).toString() + Math.trunc(t[1]).toString().padStart(9, '0'));
}

module.exports = { toBigInt };
