// Lightweight JSON-file data store. No native/database dependency is required
// to run this project — good enough for the scale of a local land-listings
// tool, and trivial to inspect or back up (it's just a JSON file).
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'db.json');

const EMPTY_STATE = {
  lands: [],
  buyers: [],
  matches: [],
  meta: { nextLandId: 1, nextBuyerId: 1, nextMatchId: 1 },
};

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_STATE, null, 2));
  }
}

function load() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(EMPTY_STATE), ...parsed };
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

function save(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// All mutations go through withState to avoid read/write races between calls.
function withState(fn) {
  const state = load();
  const result = fn(state);
  save(state);
  return result;
}

const COLLECTION_ID_KEY = {
  lands: 'nextLandId',
  buyers: 'nextBuyerId',
  matches: 'nextMatchId',
};

function getAll(collection) {
  return load()[collection];
}

function getById(collection, id) {
  return load()[collection].find((row) => row.id === Number(id)) || null;
}

function insert(collection, obj) {
  return withState((state) => {
    const idKey = COLLECTION_ID_KEY[collection];
    const id = state.meta[idKey]++;
    const now = new Date().toISOString();
    const row = { id, createdAt: now, updatedAt: now, ...obj, id };
    state[collection].push(row);
    return row;
  });
}

function update(collection, id, patch) {
  return withState((state) => {
    const idx = state[collection].findIndex((row) => row.id === Number(id));
    if (idx === -1) return null;
    const updated = {
      ...state[collection][idx],
      ...patch,
      id: state[collection][idx].id,
      updatedAt: new Date().toISOString(),
    };
    state[collection][idx] = updated;
    return updated;
  });
}

function remove(collection, id) {
  return withState((state) => {
    const before = state[collection].length;
    state[collection] = state[collection].filter((row) => row.id !== Number(id));
    return state[collection].length < before;
  });
}

// Replace every row in `collection` matching predicate with a fresh batch.
// Used e.g. to replace a land's saved top-10 buyer matches on recompute.
function replaceWhere(collection, predicate, newRows) {
  return withState((state) => {
    state[collection] = state[collection].filter((row) => !predicate(row));
    const idKey = COLLECTION_ID_KEY[collection];
    const now = new Date().toISOString();
    const inserted = newRows.map((obj) => {
      const id = state.meta[idKey]++;
      return { id, createdAt: now, updatedAt: now, ...obj, id };
    });
    state[collection].push(...inserted);
    return inserted;
  });
}

function findOne(collection, predicate) {
  return load()[collection].find(predicate) || null;
}

module.exports = {
  DATA_FILE,
  getAll,
  getById,
  insert,
  update,
  remove,
  replaceWhere,
  findOne,
};
