// Shared crawl/parse/store engine for the ss.ge and home.ge scrapers. Both
// sites are plain listing sites (no login wall), so a polite HTTP GET +
// HTML parse is sufficient — this does not attempt to bypass any access
// control, CAPTCHA or rate limiting; if a site blocks the request, that
// should be treated as "get permission / use their API instead", not an
// obstacle to route around.
'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const config = require('./config');
const { isInGeorgia } = require('../lib/georgia');
const { extractAreaM2, extractPrice } = require('./extract');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

async function fetchPage(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': config.userAgent, 'Accept-Language': 'ka,en;q=0.8' },
    timeout: 15000,
    validateStatus: (s) => s < 500,
  });
  return res.data;
}

function parseCards(html, siteConfig, pageUrl) {
  const $ = cheerio.load(html);
  const cards = $(siteConfig.cardSelector);
  const results = [];

  cards.each((_, el) => {
    const $card = $(el);
    const text = $card.text().replace(/\s+/g, ' ').trim();
    const href = $card.find(siteConfig.linkSelector).first().attr('href') || $card.attr('href');
    const sourceUrl = href ? absoluteUrl(pageUrl, href) : null;
    if (!sourceUrl) return;

    const priceText = $card.find(siteConfig.priceSelector).first().text();
    const areaText = $card.find(siteConfig.areaSelector).first().text();
    const locationText = $card.find(siteConfig.locationSelector).first().text() || text;

    const { price, currency } = extractPrice(priceText || text);
    const areaM2 = extractAreaM2(areaText) ?? extractAreaM2(text);

    results.push({
      sourceUrl,
      location: locationText.trim() || null,
      areaM2,
      price,
      currency,
      rawText: text.slice(0, 500),
    });
  });

  return results;
}

/**
 * Crawls up to `maxPages` of a listing site's land-for-sale category,
 * extracts what it can from the listing cards, and upserts into the lands
 * database (deduped by sourceUrl). Fields the card grid doesn't expose
 * (cadastral code, owner name, phone number — these are commonly revealed
 * only after an in-page "show number" click) are left null for manual
 * follow-up.
 */
async function scrapeSite({ siteName, siteConfig, debug = false } = {}) {
  const summary = { fetched: 0, parsed: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (let page = 1; page <= config.maxPages; page++) {
    const url = page === 1 ? siteConfig.landUrl : `${siteConfig.landUrl}?${siteConfig.pageParam}=${page}`;
    let html;
    try {
      html = await fetchPage(url);
      summary.fetched++;
    } catch (err) {
      summary.errors.push(`fetch ${url}: ${err.message}`);
      break;
    }

    if (debug && page === 1) {
      const debugDir = path.join(__dirname, '..', '..', 'data');
      fs.mkdirSync(debugDir, { recursive: true });
      const debugFile = path.join(debugDir, `debug-${siteName}.html`);
      fs.writeFileSync(debugFile, html);
      console.log(`[${siteName}] wrote raw HTML to ${debugFile} for selector inspection`);
    }

    const cards = parseCards(html, siteConfig, url);
    if (cards.length === 0) {
      // No cards found on this page — either we've run out of pages, or the
      // selectors in config.js no longer match the live markup.
      break;
    }

    for (const card of cards) {
      summary.parsed++;
      if (!card.areaM2) {
        summary.skipped++;
        continue; // area is a required field; nothing useful to store
      }
      const location = card.location || '';
      if (!isInGeorgia(location) && !isInGeorgia(card.rawText)) {
        // ss.ge/home.ge only list Georgian property, but if the location
        // text didn't parse cleanly we still require *some* Georgia
        // signal in the card text before accepting it.
        summary.skipped++;
        continue;
      }

      const existing = db.findOne('lands', (r) => r.sourceUrl === card.sourceUrl);
      const payload = {
        location: location || 'Georgia',
        areaM2: card.areaM2,
        cadastralCode: existing?.cadastralCode ?? null,
        category: existing?.category ?? null,
        ownerName: existing?.ownerName ?? null,
        phoneNumber: existing?.phoneNumber ?? null,
        price: card.price,
        currency: card.currency,
        pricePerM2: card.price && card.areaM2 ? Number((card.price / card.areaM2).toFixed(2)) : null,
        sourceUrl: card.sourceUrl,
        source: siteName,
        externalId: card.sourceUrl,
      };

      if (existing) {
        db.update('lands', existing.id, payload);
        summary.updated++;
      } else {
        db.insert('lands', payload);
        summary.inserted++;
      }
    }

    await sleep(config.requestDelayMs);
  }

  return summary;
}

module.exports = { scrapeSite };
