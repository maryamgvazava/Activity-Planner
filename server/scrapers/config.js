// CSS selectors used by the ss.ge / home.ge scrapers.
//
// IMPORTANT: this environment has no outbound network access to ss.ge or
// home.ge, so these selectors are a best-effort starting point based on
// typical Georgian real-estate listing markup, NOT verified against the
// live sites. Real estate sites also change their markup periodically.
//
// Before relying on scraped data, run e.g.:
//   node server/scrapers/ssge.js --debug
// which dumps the first fetched page's HTML to data/debug-ssge.html so you
// can inspect it in a browser and correct the selectors below.
'use strict';

require('dotenv').config();

module.exports = {
  ssge: {
    landUrl: process.env.SSGE_LAND_URL || 'https://home.ss.ge/en/real-estate/l/Land-for-Sale',
    // Selector for each listing "card" in the results grid.
    cardSelector: '.card, [class*="listing-card"], [class*="ListingCard"]',
    linkSelector: 'a[href*="/en/real-estate/"]',
    priceSelector: '[class*="price"]',
    areaSelector: '[class*="area"], [class*="size"]',
    locationSelector: '[class*="address"], [class*="location"]',
    // Pagination query param, e.g. ?page=2
    pageParam: 'page',
  },
  homege: {
    landUrl: process.env.HOMEGE_LAND_URL || 'https://home.ge/land/for-sale',
    cardSelector: '.property-item, [class*="listing"], [class*="property-card"]',
    linkSelector: 'a[href*="/land/"], a[href*="/pr/"]',
    priceSelector: '[class*="price"]',
    areaSelector: '[class*="area"], [class*="size"]',
    locationSelector: '[class*="address"], [class*="location"], [class*="district"]',
    pageParam: 'page',
  },
  maxPages: Number(process.env.SCRAPE_MAX_PAGES || 3),
  userAgent:
    'Mozilla/5.0 (compatible; GeorgiaLandMarketplaceBot/1.0; +https://example.invalid/bot)',
  requestDelayMs: 1500,
};
