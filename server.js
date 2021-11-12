const express = require('express');
const path = require('path');
const { readFileSync } = require('fs');
const { compareStringsSlowly } = require('./lib/compare');

const KEY_FILE = path.resolve('key.txt');
const key = readFileSync(KEY_FILE, { encoding: 'utf8' }).toString().trim();

const unsafe = !!process.argv.find(v => v.toLowerCase().includes('unsafe'));

async function compare(s1, s2) {
  return unsafe
    ? await compareStringsSlowly(s1, s2) // easy timing attack target
    : s1 === s2; // hard target
}

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  const providedApiKey = req.header('api-key')?.toString()?.trim();
  if (providedApiKey == null) {
    res.status(401).send('Unauthorized');
  } else if (await compare(providedApiKey, key)) {
    res.send('OK');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.listen(port, () => {
  console.log(`Starting in ${unsafe ? 'UNSAFE' : 'SAFE'} mode`);
  console.log(`Server is listening at http://localhost:${port}`);
});
