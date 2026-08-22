'use strict';

const express = require('express');
const db = require('../db');
const { normalizeLand, toNumberOrNull } = require('../lib/validate');

const router = express.Router();

function applyFilters(rows, q) {
  let out = rows;
  if (q.location) {
    const needle = String(q.location).toLowerCase();
    out = out.filter((r) => (r.location || '').toLowerCase().includes(needle));
  }
  if (q.category) {
    const needle = String(q.category).toLowerCase();
    out = out.filter((r) => (r.category || '').toLowerCase() === needle);
  }
  if (q.source) {
    out = out.filter((r) => r.source === q.source);
  }
  const minPrice = toNumberOrNull(q.minPrice);
  const maxPrice = toNumberOrNull(q.maxPrice);
  if (minPrice !== null) out = out.filter((r) => r.price !== null && r.price >= minPrice);
  if (maxPrice !== null) out = out.filter((r) => r.price !== null && r.price <= maxPrice);

  const minArea = toNumberOrNull(q.minArea);
  const maxArea = toNumberOrNull(q.maxArea);
  if (minArea !== null) out = out.filter((r) => r.areaM2 >= minArea);
  if (maxArea !== null) out = out.filter((r) => r.areaM2 <= maxArea);

  const minPpm2 = toNumberOrNull(q.minPricePerM2);
  const maxPpm2 = toNumberOrNull(q.maxPricePerM2);
  if (minPpm2 !== null) out = out.filter((r) => r.pricePerM2 !== null && r.pricePerM2 >= minPpm2);
  if (maxPpm2 !== null) out = out.filter((r) => r.pricePerM2 !== null && r.pricePerM2 <= maxPpm2);

  const sortBy = ['price', 'areaM2', 'pricePerM2', 'createdAt', 'location'].includes(q.sortBy)
    ? q.sortBy
    : 'createdAt';
  const order = q.order === 'asc' ? 1 : -1;
  out = [...out].sort((a, b) => {
    const av = a[sortBy] ?? -Infinity;
    const bv = b[sortBy] ?? -Infinity;
    if (av < bv) return -1 * order;
    if (av > bv) return 1 * order;
    return 0;
  });

  return out;
}

router.get('/', (req, res) => {
  const rows = applyFilters(db.getAll('lands'), req.query);
  res.json({ count: rows.length, results: rows });
});

router.get('/:id', (req, res) => {
  const row = db.getById('lands', req.params.id);
  if (!row) return res.status(404).json({ error: 'Land listing not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  try {
    const data = normalizeLand(req.body);
    const row = db.insert('lands', data);
    res.status(201).json(row);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.getById('lands', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Land listing not found' });
    const data = normalizeLand({ ...existing, ...req.body });
    const row = db.update('lands', req.params.id, data);
    res.json(row);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const ok = db.remove('lands', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Land listing not found' });
  res.status(204).end();
});

module.exports = router;
