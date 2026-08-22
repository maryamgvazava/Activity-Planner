'use strict';

const config = require('./config');
const { scrapeSite } = require('./genericSiteScraper');

async function run({ debug = false } = {}) {
  return scrapeSite({ siteName: 'home.ge', siteConfig: config.homege, debug });
}

if (require.main === module) {
  const debug = process.argv.includes('--debug');
  run({ debug }).then((summary) => {
    console.log('[home.ge]', JSON.stringify(summary, null, 2));
  }).catch((err) => {
    console.error('[home.ge] scrape failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
