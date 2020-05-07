'use strict';

import { promises as fs, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import bodyParser from 'body-parser';
import express from 'express';
import csvStringify from 'csv-stringify/lib/sync.js';

const resultFile = resolve('data', 'results.csv');
if (!existsSync(resultFile)) {
  writeFileSync(
    resultFile,
    csvStringify([[
      'timestamp', 'name', 'answer'
    ]]),
    'utf8'
  );
}

const app = express();

app.use(express.static('static'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.redirect('/survey');
});

app.get('/survey', function (req, res) {
  res.sendFile(resolve('static', 'index.html'), {
    lastModified: false
  });
});

app.post('/results', async function (req, res) {
  const results = req.body;

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).send();
  }

  if (results.find(e => !e || typeof e.name !== 'string' || typeof e.answer !== 'boolean')) {
    return res.status(400).send();
  }

  const now = new Date().toISOString();

  const resultCsv = csvStringify(
    results.map(e => ([ now, e.name, e.answer ]))
  );

  try {
    await fs.appendFile(resultFile, resultCsv, 'utf8');
  } catch (ex) {
    console.error(ex);
    res.status(500).send();
    return;
  }

  res.status(200).send();
});

const PORT = Number(process.env.PORT || '3000');

app.listen(PORT, function () {
  console.log(`> Listening on port ${PORT}!`);
});

