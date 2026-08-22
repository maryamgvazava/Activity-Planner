// Facebook ingestion via the official Graph API.
//
// This deliberately does NOT scrape facebook.com HTML: Facebook's Terms of
// Service prohibit automated scraping, and in practice it's also blocked by
// login walls and bot detection. Instead this reads posts from Pages/Groups
// you (the account behind FB_ACCESS_TOKEN) have legitimate read access to,
// via the Graph API, and filters them locally for the keywords you specified
// (იყიდება / ვყიდი -> for-sale, ვიყიდი -> wants-to-buy).
//
// Setup: see .env.example for FB_ACCESS_TOKEN / FB_PAGE_IDS / FB_GROUP_IDS.
'use strict';

require('dotenv').config();
const axios = require('axios');
const db = require('../db');
const { isInGeorgia } = require('../lib/georgia');
const { classifyPost } = require('./keywords');
const { extractPhone, extractAreaM2, extractPrice, extractLocation } = require('./extract');

const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v19.0';

function getConfiguredSources() {
  const token = process.env.FB_ACCESS_TOKEN;
  const pageIds = (process.env.FB_PAGE_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const groupIds = (process.env.FB_GROUP_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return { token, pageIds, groupIds };
}

async function fetchPosts(objectId, token) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${objectId}/posts`;
  const posts = [];
  let next = url;
  let params = { fields: 'message,permalink_url,from,created_time', access_token: token, limit: 50 };

  while (next && posts.length < 200) {
    const res = await axios.get(next, { params });
    params = undefined; // paging URLs already include the query string
    const data = res.data?.data || [];
    posts.push(...data);
    next = res.data?.paging?.next || null;
  }
  return posts;
}

function toLandPayload(post, place) {
  const text = post.message || '';
  const { price, currency } = extractPrice(text);
  return {
    location: place || 'Georgia',
    areaM2: extractAreaM2(text),
    cadastralCode: null,
    category: null,
    ownerName: post.from?.name || null,
    phoneNumber: extractPhone(text),
    price,
    currency,
    pricePerM2: null, // filled in after we know areaM2 is non-null
    sourceUrl: post.permalink_url || null,
    source: 'facebook',
    externalId: post.id,
  };
}

function toBuyerPayload(post, place) {
  const text = post.message || '';
  const { price, currency } = extractPrice(text);
  return {
    location: place || 'Georgia',
    areaM2: extractAreaM2(text),
    priceMin: price,
    priceMax: price,
    currency: price !== null ? currency || 'GEL' : null,
    advertiserName: post.from?.name || null,
    phoneNumber: extractPhone(text),
    sourceUrl: post.permalink_url || null,
    source: 'facebook',
    externalId: post.id,
  };
}

async function run() {
  const { token, pageIds, groupIds } = getConfiguredSources();
  const summary = { fetched: 0, forSale: 0, wantToBuy: 0, skipped: 0, errors: [] };

  if (!token || (pageIds.length === 0 && groupIds.length === 0)) {
    summary.errors.push(
      'Missing FB_ACCESS_TOKEN and/or FB_PAGE_IDS/FB_GROUP_IDS. See .env.example — Facebook ' +
        'ingestion requires a Graph API token for Pages/Groups you have permission to read.'
    );
    return summary;
  }

  for (const objectId of [...pageIds, ...groupIds]) {
    let posts;
    try {
      posts = await fetchPosts(objectId, token);
    } catch (err) {
      summary.errors.push(`fetch posts for ${objectId}: ${err.response?.data?.error?.message || err.message}`);
      continue;
    }

    for (const post of posts) {
      summary.fetched++;
      const text = post.message || '';
      const kind = classifyPost(text);
      if (!kind || !post.permalink_url) {
        summary.skipped++;
        continue;
      }
      const place = extractLocation(text);
      if (!place && !isInGeorgia(text)) {
        summary.skipped++; // can't confirm this is about land in Georgia
        continue;
      }

      const existing = db.findOne(
        kind === 'sell' ? 'lands' : 'buyers',
        (r) => r.externalId === post.id
      );
      if (existing) {
        summary.skipped++;
        continue;
      }

      if (kind === 'sell') {
        const payload = toLandPayload(post, place);
        if (!payload.areaM2) {
          summary.skipped++; // area is a required field for the lands table
          continue;
        }
        payload.pricePerM2 = payload.price ? Number((payload.price / payload.areaM2).toFixed(2)) : null;
        db.insert('lands', payload);
        summary.forSale++;
      } else {
        const payload = toBuyerPayload(post, place);
        if (!payload.areaM2) {
          summary.skipped++;
          continue;
        }
        db.insert('buyers', payload);
        summary.wantToBuy++;
      }
    }
  }

  return summary;
}

if (require.main === module) {
  run().then((summary) => {
    console.log('[facebook]', JSON.stringify(summary, null, 2));
  }).catch((err) => {
    console.error('[facebook] ingestion failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
