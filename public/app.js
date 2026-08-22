'use strict';

const state = { lands: [], buyers: [] };

// ---------- tabs ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ---------- modal ----------
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContent = document.getElementById('modal-content');
document.getElementById('modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

function openModal(html) {
  modalContent.innerHTML = html;
  modalBackdrop.classList.remove('hidden');
}
function closeModal() {
  modalBackdrop.classList.add('hidden');
  modalContent.innerHTML = '';
}

function fmtMoney(value, currency) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toLocaleString()} ${currency || ''}`.trim();
}

function qs(formEl) {
  const data = new FormData(formEl);
  const params = new URLSearchParams();
  for (const [k, v] of data.entries()) if (v !== '') params.set(k, v);
  return params.toString();
}

// ---------- lands ----------
async function loadLands(query = '') {
  const res = await fetch(`/api/lands${query ? `?${query}` : ''}`);
  const json = await res.json();
  state.lands = json.results;
  renderLands();
}

function renderLands() {
  const tbody = document.querySelector('#lands-table tbody');
  tbody.innerHTML = state.lands.map((l) => `
    <tr>
      <td>${l.location || ''}</td>
      <td>${l.areaM2 ?? ''}</td>
      <td>${fmtMoney(l.price, l.currency)}</td>
      <td>${l.pricePerM2 ? fmtMoney(l.pricePerM2, l.currency) : '—'}</td>
      <td>${l.cadastralCode || '—'}</td>
      <td>${l.category || '—'}</td>
      <td>${l.ownerName || '—'}</td>
      <td>${l.phoneNumber || '—'}</td>
      <td><span class="pill">${l.source || 'manual'}</span></td>
      <td><a href="${l.sourceUrl}" target="_blank" rel="noopener">open</a></td>
      <td><button data-match="${l.id}">Top 10 buyers</button></td>
    </tr>
  `).join('') || '<tr><td colspan="11">No land listings yet.</td></tr>';

  tbody.querySelectorAll('[data-match]').forEach((btn) => {
    btn.addEventListener('click', () => searchMatches(btn.dataset.match));
  });
}

document.getElementById('lands-filter').addEventListener('submit', (e) => {
  e.preventDefault();
  loadLands(qs(e.target));
});
document.getElementById('lands-reset').addEventListener('click', () => {
  document.getElementById('lands-filter').reset();
  loadLands();
});

// ---------- buyers ----------
async function loadBuyers(query = '') {
  const res = await fetch(`/api/buyers${query ? `?${query}` : ''}`);
  const json = await res.json();
  state.buyers = json.results;
  renderBuyers();
}

function renderBuyers() {
  const tbody = document.querySelector('#buyers-table tbody');
  tbody.innerHTML = state.buyers.map((b) => `
    <tr>
      <td>${b.location || ''}</td>
      <td>${b.areaM2 ?? ''}</td>
      <td>${b.priceMin || b.priceMax ? `${fmtMoney(b.priceMin, '')}–${fmtMoney(b.priceMax, b.currency)}` : '—'}</td>
      <td>${b.advertiserName || '—'}</td>
      <td>${b.phoneNumber || '—'}</td>
      <td><span class="pill">${b.source || 'manual'}</span></td>
      <td><a href="${b.sourceUrl}" target="_blank" rel="noopener">open</a></td>
    </tr>
  `).join('') || '<tr><td colspan="7">No buyer listings yet.</td></tr>';
}

document.getElementById('buyers-filter').addEventListener('submit', (e) => {
  e.preventDefault();
  loadBuyers(qs(e.target));
});
document.getElementById('buyers-reset').addEventListener('click', () => {
  document.getElementById('buyers-filter').reset();
  loadBuyers();
});

// ---------- matching ----------
async function searchMatches(landId) {
  openModal('<p>Searching top 10 matching buyers…</p>');
  const res = await fetch(`/api/matches/${landId}/search`, { method: 'POST' });
  const json = await res.json();
  if (!res.ok) {
    openModal(`<div class="error-box">${json.error}</div>`);
    return;
  }
  const land = state.lands.find((l) => l.id === Number(landId));
  const rows = json.results.map((m, i) => `
    <div class="match-row">
      <div>
        <strong>#${i + 1} ${m.buyer?.advertiserName || 'Unknown advertiser'}</strong><br/>
        <span class="match-breakdown">
          ${m.buyer?.location || ''} · wants ${m.buyer?.areaM2 ?? '?'} m²
          · ${m.buyer?.priceMin || m.buyer?.priceMax ? `${fmtMoney(m.buyer.priceMin, '')}–${fmtMoney(m.buyer.priceMax, m.buyer.currency)}` : 'no price given'}
          · ${m.buyer?.phoneNumber || 'no phone'}
          ${m.buyer?.sourceUrl ? `· <a href="${m.buyer.sourceUrl}" target="_blank" rel="noopener">post</a>` : ''}
        </span><br/>
        <span class="match-breakdown">location ${m.breakdown.locationScore}/40 · area ${m.breakdown.areaScore}/30 · price ${m.breakdown.priceScore}/30</span>
      </div>
      <div class="match-score">${m.score}</div>
    </div>
  `).join('') || '<p>No buyers in the database yet.</p>';

  openModal(`
    <h3>Top ${json.count} buyer matches</h3>
    <p class="match-breakdown">for land at "${land?.location || landId}" — saved to the matches database.</p>
    ${rows}
  `);
}

// ---------- add land ----------
document.getElementById('lands-add-btn').addEventListener('click', () => {
  openModal(`
    <h3>Add land listing</h3>
    <div id="lands-add-error"></div>
    <form id="lands-add-form" class="form-grid">
      <label>Location*<input name="location" required /></label>
      <label>Area m²*<input name="areaM2" type="number" step="any" required /></label>
      <label>Cadastral code<input name="cadastralCode" /></label>
      <label>Category<input name="category" /></label>
      <label>Owner<input name="ownerName" /></label>
      <label>Phone<input name="phoneNumber" /></label>
      <label>Price<input name="price" type="number" step="any" /></label>
      <label>Currency<input name="currency" placeholder="GEL / USD / EUR" /></label>
      <label style="grid-column: 1 / -1">Post link*<input name="sourceUrl" required /></label>
      <div class="form-actions" style="grid-column: 1 / -1">
        <button type="submit">Save</button>
      </div>
    </form>
  `);
  document.getElementById('lands-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    const res = await fetch('/api/lands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      document.getElementById('lands-add-error').innerHTML = `<div class="error-box">${json.error}</div>`;
      return;
    }
    closeModal();
    loadLands();
  });
});

// ---------- add buyer ----------
document.getElementById('buyers-add-btn').addEventListener('click', () => {
  openModal(`
    <h3>Add buyer listing</h3>
    <div id="buyers-add-error"></div>
    <form id="buyers-add-form" class="form-grid">
      <label>Location*<input name="location" required /></label>
      <label>Area m²*<input name="areaM2" type="number" step="any" required /></label>
      <label>Price min<input name="priceMin" type="number" step="any" /></label>
      <label>Price max<input name="priceMax" type="number" step="any" /></label>
      <label>Currency<input name="currency" placeholder="GEL / USD / EUR" /></label>
      <label>Advertiser name<input name="advertiserName" /></label>
      <label>Phone<input name="phoneNumber" /></label>
      <label style="grid-column: 1 / -1">Post link*<input name="sourceUrl" required /></label>
      <div class="form-actions" style="grid-column: 1 / -1">
        <button type="submit">Save</button>
      </div>
    </form>
  `);
  document.getElementById('buyers-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    const res = await fetch('/api/buyers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      document.getElementById('buyers-add-error').innerHTML = `<div class="error-box">${json.error}</div>`;
      return;
    }
    closeModal();
    loadBuyers();
  });
});

// ---------- CSV import ----------
function wireCsvImport(inputId, endpoint, statusId, reload) {
  document.getElementById(inputId).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById(statusId);
    status.textContent = 'Importing…';
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) {
      status.textContent = `Import failed: ${json.error}`;
      return;
    }
    status.textContent = `Imported ${json.inserted} rows${json.failed.length ? `, ${json.failed.length} failed` : ''}.`;
    reload();
    e.target.value = '';
  });
}
wireCsvImport('lands-csv', '/api/ingest/import/lands', 'lands-status', loadLands);
wireCsvImport('buyers-csv', '/api/ingest/import/buyers', 'buyers-status', loadBuyers);

// ---------- scraper triggers ----------
function wireScraperButton(btnId, source) {
  document.getElementById(btnId).addEventListener('click', async () => {
    const status = document.getElementById('lands-status');
    status.textContent = `Running ${source}…`;
    const res = await fetch(`/api/ingest/run/${source}`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      status.textContent = `${source} failed: ${json.error}`;
      return;
    }
    status.textContent = `${source}: ${JSON.stringify(json.summary)}`;
    loadLands();
    loadBuyers();
  });
}
wireScraperButton('run-ssge', 'ssge');
wireScraperButton('run-homege', 'homege');
wireScraperButton('run-facebook', 'facebook');

// ---------- init ----------
loadLands();
loadBuyers();
