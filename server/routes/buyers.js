'use strict';

const express = require('express');
const db = require('../db');
const { normalizeBuyer, toNumberOrNull } = require('../lib/validate');

const router = express.Router();

function applyFilters(rows, q) {
  let out = rows;
  if (q.location) {
    const needle = String(q.location).toLowerCase();
    out = out.filter((r) => (r.location || '').toLowerCase().includes(needle));
  }
  if (q.source) {
    out = out.filter((r) => r.source === q.source);
  }

  const minArea = toNumberOrNull(q.minArea);
  const maxArea = toNumberOrNull(q.maxArea);
  if (minArea !== null) out = out.filter((r) => r.areaM2 >= minArea);
  if (maxArea !== null) out = out.filter((r) => r.areaM2 <= maxArea);

  // A buyer "matches" a price filter if their [priceMin, priceMax] range
  // overlaps the requested [minPrice, maxPrice] window.
  const minPrice = toNumberOrNull(q.minPrice);
  const maxPrice = toNumberOrNull(q.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    out = out.filter((r) => {
      if (r.priceMin === null && r.priceMax === null) return false;
      const rMin = r.priceMin ?? r.priceMax;
      const rMax = r.priceMax ?? r.priceMin;
      if (minPrice !== null && rMax < minPrice) return false;
      if (maxPrice !== null && rMin > maxPrice) return false;
      return true;
    });
  }

  // Price-per-m2 filter, derived from the buyer's price range / desired area.
  const minPpm2 = toNumberOrNull(q.minPricePerM2);
  const maxPpm2 = toNumberOrNull(q.maxPricePerM2);
  if (minPpm2 !== null || maxPpm2 !== null) {
    out = out.filter((r) => {
      if (!r.areaM2 || (r.priceMin === null && r.priceMax === null)) return false;
      const avgPrice = ((r.priceMin ?? r.priceMax) + (r.priceMax ?? r.priceMin)) / 2;
      const ppm2 = avgPrice / r.areaM2;
      if (minPpm2 !== null && ppm2 < minPpm2) return false;
      if (maxPpm2 !== null && ppm2 > maxPpm2) return false;
      return true;
    });
  }

  const sortBy = ['priceMin', 'priceMax', 'areaM2', 'createdAt', 'location'].includes(q.sortBy)
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
  const rows = applyFilters(db.getAll('buyers'), req.query);
  res.json({ count: rows.length, results: rows });
});

router.get('/:id', (req, res) => {
  const row = db.getById('buyers', req.params.id);
  if (!row) return res.status(404).json({ error: 'Buyer listing not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  try {
    const data = normalizeBuyer(req.body);
    const row = db.insert('buyers', data);
    res.status(201).json(row);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.getById('buyers', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Buyer listing not found' });
    const data = normalizeBuyer({ ...existing, ...req.body });
    const row = db.update('buyers', req.params.id, data);
    res.json(row);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const ok = db.remove('buyers', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Buyer listing not found' });
  res.status(204).end();
});

module.exports = router;
