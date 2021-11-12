const express = require('express');
const path = require('path');
const { readFileSync } = require('fs');
const { compareStringsSlowly } = require('./lib/compare');

const KEY_FILE = path.resolve('key.txt');

const key = readFileSync(KEY_FILE, { encoding: 'utf8' }).toString().trim();

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  const providedApiKey = req.header('api-key')?.toString()?.trim();
  if (providedApiKey == null) {
    res.status(401).send('Unauthorized');
  // } else if (providedApiKey === key) {
  } else if (await compareStringsSlowly(providedApiKey, key)) {
    res.send('OK');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
