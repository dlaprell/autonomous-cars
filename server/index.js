'use strict';

import { promises as fs, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import bodyParser from 'body-parser';
import express from 'express';
import csvStringify from 'csv-stringify/lib/sync.js';
import Joi from '@hapi/joi';
import asyncHandler from 'express-async-handler';

const resultSchema = Joi
  .object({
    mobile: Joi.boolean().required(),
    driverLicense: Joi.boolean().required(),
    age: Joi.number().min(1).max(130).required(),

    results: Joi
      .array()
      .items(
        Joi
          .object({
            name: Joi.string().required(),
            answer: Joi.boolean().required()
          })
          .required()
      )
      .min(1)
      .max(60)
      .required()
  })
  .required();

const resultFile = resolve('data', 'results.csv');
if (!existsSync(resultFile)) {
  writeFileSync(
    resultFile,
    csvStringify([[
      'timestamp', 'name','answer','mobile','driverLicense','age'
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

app.post('/results', asyncHandler(async function (req, res) {
  const data = req.body;
  const {
    results,
    mobile,
    driverLicense,
    age
  } = await resultSchema.validateAsync(data);

  const now = new Date().toISOString();

  const resultCsv = csvStringify(
    results.map(e => ([
      now,
      e.name,
      e.answer ? 'true' : 'false',
      mobile ? 'true' : 'false',
      driverLicense ? 'true' : 'false',
      age
    ]))
  );

  try {
    await fs.appendFile(resultFile, resultCsv, 'utf8');
  } catch (ex) {
    console.error(ex);
    res.status(500).send();
    return;
  }

  res.status(200).send();
}));

const PORT = Number(process.env.PORT || '3000');

app.listen(PORT, function () {
  console.log(`> Listening on port ${PORT}!`);
});

