// Regex-based field extraction from free-text listing/post bodies. Used as
// the primary source for Facebook posts, and as a fallback for ss.ge/home.ge
// cards when a specific selector doesn't turn up a value.
'use strict';

const { extractPlace } = require('../lib/georgia');

// Georgian mobile numbers: 9 digits starting with 5, optionally prefixed
// with +995/995/0, with optional spacing/dashes.
const PHONE_RE = /(?:\+?995[\s-]?)?(0)?5\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/;

function extractPhone(text) {
  const m = String(text || '').match(PHONE_RE);
  if (!m) return null;
  const digits = m[0].replace(/\D/g, '');
  const last9 = digits.slice(-9);
  return `+995${last9}`;
}

// e.g. "1200 m2", "1200მ2", "1200 კვ.მ", "0.5 ha"
const AREA_M2_RE = /(\d+(?:[.,]\d+)?)\s*(?:m2|m²|მ2|მ²|კვ\.?\s?მ)/i;
const AREA_HA_RE = /(\d+(?:[.,]\d+)?)\s*(?:ha|ჰა)/i;

function extractAreaM2(text) {
  const t = String(text || '');
  const m2 = t.match(AREA_M2_RE);
  if (m2) return Number(m2[1].replace(',', '.'));
  const ha = t.match(AREA_HA_RE);
  if (ha) return Number(ha[1].replace(',', '.')) * 10000;
  return null;
}

// e.g. "$25,000", "25000 GEL", "₾25 000", "25000 დოლარი", "25000 ლარი"
const PRICE_RE = /(?:(\$|₾|USD|GEL|EUR|€)\s?)?([\d][\d\s,.]{2,})\s?(\$|₾|USD|GEL|EUR|€|დოლარი|ლარი|ევრო)?/;

const CURRENCY_MAP = {
  $: 'USD', usd: 'USD', 'დოლარი': 'USD',
  '₾': 'GEL', gel: 'GEL', 'ლარი': 'GEL',
  '€': 'EUR', eur: 'EUR', 'ევრო': 'EUR',
};

function normalizeCurrencyToken(tok) {
  if (!tok) return null;
  return CURRENCY_MAP[tok.toLowerCase()] || CURRENCY_MAP[tok] || null;
}

function extractPrice(text) {
  const t = String(text || '');
  const m = t.match(PRICE_RE);
  if (!m) return { price: null, currency: null };
  const currency = normalizeCurrencyToken(m[1]) || normalizeCurrencyToken(m[3]);
  const numeric = Number(m[2].replace(/[\s,]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return { price: null, currency: null };
  return { price: numeric, currency: currency || null };
}

function extractLocation(text) {
  return extractPlace(text);
}

module.exports = { extractPhone, extractAreaM2, extractPrice, extractLocation };
