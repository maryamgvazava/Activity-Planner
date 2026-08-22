'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');

const landsRouter = require('./routes/lands');
const buyersRouter = require('./routes/buyers');
const matchesRouter = require('./routes/matches');
const ingestRouter = require('./routes/ingest');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/lands', landsRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/ingest', ingestRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Georgia Land Marketplace listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
