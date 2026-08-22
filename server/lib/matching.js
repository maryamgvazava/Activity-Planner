// Scores how well a buyer's stated wishes match a specific land listing, so
// we can pull the top 10 candidate buyers for any given land record.
'use strict';

const { normalize } = require('./georgia');

function locationScore(landLocation, buyerLocation) {
  const land = normalize(landLocation);
  const buyer = normalize(buyerLocation);
  if (!land || !buyer) return 0;
  if (land === buyer) return 40;
  // Substring either direction covers e.g. land="Tbilisi, Vake" vs buyer="Vake"
  if (land.includes(buyer) || buyer.includes(land)) return 40;
  // Token overlap: share at least one word longer than 3 chars
  const landTokens = land.split(/[\s,/-]+/).filter((t) => t.length > 3);
  const buyerTokens = new Set(buyer.split(/[\s,/-]+/).filter((t) => t.length > 3));
  const overlap = landTokens.some((t) => buyerTokens.has(t));
  return overlap ? 25 : 0;
}

function areaScore(landAreaM2, buyerAreaM2) {
  if (!landAreaM2 || !buyerAreaM2) return 0;
  const relDiff = Math.abs(landAreaM2 - buyerAreaM2) / Math.max(landAreaM2, buyerAreaM2);
  // Exact match -> 30, falls off linearly, 0 once the sizes differ by 60%+
  const score = 30 * (1 - relDiff / 0.6);
  return Math.max(0, Math.round(score));
}

function priceScore(land, buyer) {
  if (land.price === null || land.price === undefined) return 15; // unknown, neutral
  if (buyer.priceMin === null && buyer.priceMax === null) return 15; // unknown, neutral
  if (buyer.currency && land.currency && buyer.currency !== land.currency) return 10; // can't compare directly

  const min = buyer.priceMin ?? buyer.priceMax;
  const max = buyer.priceMax ?? buyer.priceMin;
  if (land.price >= min && land.price <= max) return 30;

  const distance = land.price < min ? min - land.price : land.price - max;
  const range = Math.max(max - min, max * 0.1, 1);
  const score = 30 * (1 - distance / range);
  return Math.max(0, Math.round(score));
}

function computeMatchScore(land, buyer) {
  const loc = locationScore(land.location, buyer.location);
  const area = areaScore(land.areaM2, buyer.areaM2);
  const price = priceScore(land, buyer);
  return {
    score: loc + area + price,
    breakdown: { locationScore: loc, areaScore: area, priceScore: price },
  };
}

/** Returns the top N buyers (default 10) ranked against a single land record. */
function getTopMatches(land, buyers, limit = 10) {
  return buyers
    .map((buyer) => {
      const { score, breakdown } = computeMatchScore(land, buyer);
      return { buyer, score, breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { computeMatchScore, getTopMatches };
