'use strict';

const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('../db');
const { normalizeLand, normalizeBuyer } = require('../lib/validate');
const ssge = require('../scrapers/ssge');
const homege = require('../scrapers/homege');
const facebook = require('../scrapers/facebook');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const SCRAPERS = { ssge, homege, facebook };

// Trigger a scraper run on demand (in addition to running it via cron/CLI).
router.post('/run/:source', async (req, res) => {
  const scraper = SCRAPERS[req.params.source];
  if (!scraper) {
    return res.status(400).json({ error: `Unknown source "${req.params.source}". Use one of: ${Object.keys(SCRAPERS).join(', ')}` });
  }
  try {
    const summary = await scraper.run();
    res.json({ source: req.params.source, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parseCsv(buffer) {
  return parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
}

router.post('/import/lands', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required (field name "file")' });
  let rows;
  try {
    rows = parseCsv(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
  }

  const inserted = [];
  const failed = [];
  rows.forEach((row, i) => {
    try {
      const data = normalizeLand({ ...row, source: row.source || 'manual-import' });
      inserted.push(db.insert('lands', data));
    } catch (err) {
      failed.push({ row: i + 1, error: err.message });
    }
  });

  res.json({ inserted: inserted.length, failed });
});

router.post('/import/buyers', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required (field name "file")' });
  let rows;
  try {
    rows = parseCsv(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
  }

  const inserted = [];
  const failed = [];
  rows.forEach((row, i) => {
    try {
      const data = normalizeBuyer({ ...row, source: row.source || 'manual-import' });
      inserted.push(db.insert('buyers', data));
    } catch (err) {
      failed.push({ row: i + 1, error: err.message });
    }
  });

  res.json({ inserted: inserted.length, failed });
});

module.exports = router;
