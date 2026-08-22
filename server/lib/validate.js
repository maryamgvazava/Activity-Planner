'use strict';

const { isInGeorgia } = require('./georgia');

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalizes + validates a "land for sale" payload.
 * Throws { status, message } style errors (plain Error with .status) on
 * missing/invalid required fields.
 */
function normalizeLand(body, { requireGeorgia = true } = {}) {
  const location = String(body.location || '').trim();
  const areaM2 = toNumberOrNull(body.areaM2);
  const cadastralCode = String(body.cadastralCode || '').trim();
  const category = String(body.category || '').trim();
  const ownerName = String(body.ownerName || '').trim();
  const phoneNumber = String(body.phoneNumber || '').trim();
  const sourceUrl = String(body.sourceUrl || '').trim();
  const source = String(body.source || 'manual').trim();
  const price = toNumberOrNull(body.price);
  const currency = body.currency ? String(body.currency).trim().toUpperCase() : null;

  const errors = [];
  if (!location) errors.push('location is required');
  if (areaM2 === null || areaM2 <= 0) errors.push('areaM2 must be a positive number');
  if (!sourceUrl) errors.push("post's link address (sourceUrl) is required");

  if (requireGeorgia && location && !isInGeorgia(location)) {
    errors.push(`location "${location}" does not appear to be in Georgia`);
  }

  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }

  return {
    location,
    areaM2,
    cadastralCode: cadastralCode || null,
    category: category || null,
    ownerName: ownerName || null,
    phoneNumber: phoneNumber || null,
    price,
    currency: price !== null ? currency || 'GEL' : null,
    pricePerM2: price !== null && areaM2 ? Number((price / areaM2).toFixed(2)) : null,
    sourceUrl,
    source,
    externalId: body.externalId ? String(body.externalId) : null,
  };
}

/**
 * Normalizes + validates a "wants to buy land" payload. Price can be a
 * single value or a range; at least one bound is required if price info is
 * supplied at all (both may be left out entirely).
 */
function normalizeBuyer(body, { requireGeorgia = true } = {}) {
  const location = String(body.location || '').trim();
  const areaM2 = toNumberOrNull(body.areaM2);
  const advertiserName = String(body.advertiserName || '').trim();
  const phoneNumber = String(body.phoneNumber || '').trim();
  const sourceUrl = String(body.sourceUrl || '').trim();
  const source = String(body.source || 'manual').trim();

  let priceMin = toNumberOrNull(body.priceMin);
  let priceMax = toNumberOrNull(body.priceMax);
  const singlePrice = toNumberOrNull(body.price);
  if (singlePrice !== null && priceMin === null && priceMax === null) {
    priceMin = singlePrice;
    priceMax = singlePrice;
  }
  const currency = body.currency ? String(body.currency).trim().toUpperCase() : null;

  const errors = [];
  if (!location) errors.push('location is required');
  if (areaM2 === null || areaM2 <= 0) errors.push('areaM2 must be a positive number');
  if (!sourceUrl) errors.push("post's link address (sourceUrl) is required");
  if ((priceMin !== null || priceMax !== null) && !currency) {
    errors.push('currency is required when a price or price range is given');
  }
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    errors.push('priceMin cannot be greater than priceMax');
  }

  if (requireGeorgia && location && !isInGeorgia(location)) {
    errors.push(`location "${location}" does not appear to be in Georgia`);
  }

  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }

  return {
    location,
    areaM2,
    priceMin,
    priceMax,
    currency: priceMin !== null || priceMax !== null ? currency : null,
    advertiserName: advertiserName || null,
    phoneNumber: phoneNumber || null,
    sourceUrl,
    source,
    externalId: body.externalId ? String(body.externalId) : null,
  };
}

module.exports = { normalizeLand, normalizeBuyer, toNumberOrNull };
