// Keyword rules used to find & classify Facebook posts about land.
'use strict';

// First-person "I'm selling" / passive "for sale" -> goes to the
// lands-for-sale database.
const SELL_KEYWORDS = ['იყიდება', 'ვყიდი'];

// First-person "I will buy" -> goes to the people-who-want-to-buy database.
const BUY_KEYWORDS = ['ვიყიდი'];

// The sell/buy keywords above are common Georgian slang for selling/buying
// anything, so we additionally require a land-related word in the same post
// to avoid pulling in unrelated "selling my car" style posts.
const LAND_KEYWORDS = [
  'მიწა', 'მიწის ნაკვეთი', 'ნაკვეთი', 'საკადასტრო', 'კადასტრი',
  'სასოფლო-სამეურნეო', 'სახნავი', 'სათიბი', 'საბაღე', 'ეზო',
  'land', 'plot', 'parcel', 'cadastr',
];

function containsAny(text, keywords) {
  const t = String(text || '');
  return keywords.some((k) => t.includes(k));
}

/**
 * Classifies a post's text as a 'sell' listing, a 'buy' listing, or null if
 * it doesn't look like a land sale/purchase post at all.
 */
function classifyPost(text) {
  if (!containsAny(text, LAND_KEYWORDS)) return null;
  if (containsAny(text, SELL_KEYWORDS)) return 'sell';
  if (containsAny(text, BUY_KEYWORDS)) return 'buy';
  return null;
}

module.exports = { SELL_KEYWORDS, BUY_KEYWORDS, LAND_KEYWORDS, classifyPost, containsAny };
