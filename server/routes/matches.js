// Computes and persists the top-10 matching buyers for a given land listing
// into their own "matches" collection (the second database the user asked
// for), so a search result can be revisited later without recomputing it.
'use strict';

const express = require('express');
const db = require('../db');
const { getTopMatches } = require('../lib/matching');

const router = express.Router();

function toApiShape(matchRow) {
  const buyer = db.getById('buyers', matchRow.buyerId);
  return {
    id: matchRow.id,
    landId: matchRow.landId,
    buyerId: matchRow.buyerId,
    score: matchRow.score,
    breakdown: matchRow.breakdown,
    createdAt: matchRow.createdAt,
    buyer,
  };
}

// Recompute the top 10 buyer matches for a land and persist them, replacing
// whatever was previously saved for that land.
router.post('/:landId/search', (req, res) => {
  const land = db.getById('lands', req.params.landId);
  if (!land) return res.status(404).json({ error: 'Land listing not found' });

  const buyers = db.getAll('buyers');
  const top = getTopMatches(land, buyers, 10);

  const rows = top.map((m) => ({
    landId: land.id,
    buyerId: m.buyer.id,
    score: m.score,
    breakdown: m.breakdown,
  }));

  const saved = db.replaceWhere('matches', (r) => r.landId === land.id, rows);
  res.json({ landId: land.id, count: saved.length, results: saved.map(toApiShape) });
});

// Fetch the previously saved matches for a land without recomputing.
router.get('/:landId', (req, res) => {
  const land = db.getById('lands', req.params.landId);
  if (!land) return res.status(404).json({ error: 'Land listing not found' });

  const saved = db
    .getAll('matches')
    .filter((r) => r.landId === Number(req.params.landId))
    .sort((a, b) => b.score - a.score);

  res.json({ landId: land.id, count: saved.length, results: saved.map(toApiShape) });
});

module.exports = router;
