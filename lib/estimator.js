const mathjs = require("mathjs");

/**
 * Implements "midsummary" L-estimator from "Web Timing Attacks Made Practical" (Morgan & Morgan, 2015)
 * @see <https://www.blackhat.com/docs/us-15/materials/us-15-Morgan-Web-Timing-Attacks-Made-Practical-wp.pdf>
 * @param observations {BigInt[]} Array of observed round trip times in nanoseconds
 * @return {number} Estimated avg. number of microseconds
 */
function midsummary(observations) {
  const w = 10;
  // Convert to microseconds
  const ns = observations.map(t => Number(t / 1000n));
  const l = mathjs.quantileSeq(ns, (50 - w)/100);
  const r = mathjs.quantileSeq(ns, (50 + w)/100);
  return mathjs.mean(l, r);
}

module.exports = { midsummary };
