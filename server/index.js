'use strict';

import { promises as fs, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import bodyParser from 'body-parser';
import express from 'express';
import csvStringify from 'csv-stringify/lib/sync.js';
import Joi from '@hapi/joi';
import asyncHandler from 'express-async-handler';
import staticComp from 'express-static-gzip';
import { createHash } from 'crypto';
import Bowser from "bowser/bundled.js";

let uidInternalCounter = 0;

const resultSchema = Joi
  .object({
    driverLicense: Joi.boolean().required(),
    age: Joi.number().min(1).max(130).required(),
    group: Joi.string().pattern(/^(a|b)$/),
    gender: Joi.string().pattern(/^(male|female|diverse)$/),

    email: Joi.string().allow(null).optional(),

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

const resultDir = resolve('data');
const resultFile = resolve(resultDir, 'results.csv');
const emailFile = resolve(resultDir, 'emails.csv');

if (!existsSync(resultFile)) {
  writeFileSync(
    resultFile,
    csvStringify([[
      'unique id',
      'timestamp',
      'group',
      'trial',
      'situation',
      'answer',
      'platform',
      'gender',
      'driverLicense',
      'age'
    ]]),
    'utf8'
  );
}

if (!existsSync(emailFile)) {
  writeFileSync(
    emailFile,
    csvStringify([[
      'email address'
    ]]),
    'utf8'
  );
}

function deriveUniqueId(...args) {
  const c = createHash('sha256');

  for (const arg of args) {
    let d = arg;

    if (typeof d === 'boolean') {
      d = arg ? 'true' : 'false';
    } else if (typeof d === 'number') {
      d = String(arg);
    }

    c.update(Buffer.from(d));
  }

  return c.digest('hex').slice(0, 12);
}

const app = express();

app.get('/', function (req, res) {
  res.redirect('/survey');
});

app.use(staticComp('static', {
  enableBrotli: true,
  orderPreference: [ 'br', 'gz' ]
}));
app.use(bodyParser.json({
  limit: '30kb'
}));

app.get('/survey', function (req, res) {
  res.sendFile(resolve('static', 'index.html'), {
    lastModified: false
  });
});

app.post('/results', asyncHandler(async function (req, res) {
  const data = req.body;
  const {
    results,
    gender,
    group,
    driverLicense,
    age,
    email
  } = await resultSchema.validateAsync(data);

  const reqWith = req.get('X-Request-With');
  if (!reqWith || !/^survey-\d+\.\d+\.\d+$/.test(reqWith)) {
    return res
      .status(400)
      .send('Unknown sender');
  }

  const userAgent = req.get('User-Agent') || 'unknonw';
  const langs = req.get('Accept-Language') || 'unknonw';

  const browser = Bowser.getParser(userAgent);
  const platform = browser.getPlatformType(true) || 'unknown';

  const now = new Date().toISOString();

  const uid = deriveUniqueId(
    uidInternalCounter++,
    now,
    reqWith,
    userAgent,
    langs,
    platform,
    gender,
    driverLicense,
    gender,
    age
  );

  const resultCsv = csvStringify(
    results.map((e, idx) => ([
      uid,
      now,
      group,
      idx + 1,
      e.name,
      e.answer ? 'true' : 'false',
      platform,
      gender,
      driverLicense ? 'true' : 'false',
      age
    ]))
  );

  try {
    await fs.appendFile(resultFile, resultCsv, 'utf8');

    if (email) {
      await fs.appendFile(emailFile, `${email}\n`, 'utf8');
    }

    await fs.writeFile(
      resolve(resultDir, `${uid}.json`),
      JSON.stringify(
        {
          uid,
          group,
          age,
          gender,
          platform,
          driverLicense,
          datetime: now,
          results
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (ex) {
    console.error(ex);
    res.status(500).send(ex.message);
    return;
  }

  res.status(200).send();
}));

const PORT = Number(process.env.PORT || '3000');

app.listen(PORT, function () {
  console.log(`> Listening on port ${PORT}!`);
});

