'use strict';

const config = require('./config');
const { scrapeSite } = require('./genericSiteScraper');

async function run({ debug = false } = {}) {
  return scrapeSite({ siteName: 'ss.ge', siteConfig: config.ssge, debug });
}

if (require.main === module) {
  const debug = process.argv.includes('--debug');
  run({ debug }).then((summary) => {
    console.log('[ss.ge]', JSON.stringify(summary, null, 2));
  }).catch((err) => {
    console.error('[ss.ge] scrape failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
