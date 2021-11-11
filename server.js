const express = require('express');
const path = require('path');
const { readFileSync } = require('fs');

const KEY_FILE = path.resolve('key.txt');

const key = readFileSync(KEY_FILE, { encoding: 'utf8' }).toString().trim();

const app = express();
const port = 3000;

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function compareStrings(s1, s2) {
  const l1 = s1.length, l2 = s2.length;
  if (l1 !== l2) {
    return false;
  }
  await sleep(1);
  let i = 0, c1 = 0, c2 = 0;
  while (i < l1) {
    c1 = s1.charCodeAt(i);
    c2 = s2.charCodeAt(i);
    if (c1 !== c2) break;
    await sleep(1);
    i++;
  }
  return i === l1;
}

app.get('/', async (req, res) => {
  const providedApiKey = req.header('api-key')?.toString()?.trim();
  if (providedApiKey == null) {
    res.status(401).send('Unauthorized');
  } else if (providedApiKey === key) {
  // } else if (await compareStrings(providedApiKey, key)) {
    res.send('OK');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
