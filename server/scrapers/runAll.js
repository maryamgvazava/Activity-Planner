'use strict';

const ssge = require('./ssge');
const homege = require('./homege');
const facebook = require('./facebook');

async function run() {
  const results = {};
  results.ssge = await ssge.run().catch((err) => ({ errors: [err.message] }));
  results.homege = await homege.run().catch((err) => ({ errors: [err.message] }));
  results.facebook = await facebook.run().catch((err) => ({ errors: [err.message] }));
  return results;
}

if (require.main === module) {
  run().then((results) => {
    console.log(JSON.stringify(results, null, 2));
  });
}

module.exports = { run };
