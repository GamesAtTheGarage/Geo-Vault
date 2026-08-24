let allCoins = [];
let filteredCoins = [];
let activeFilter = 'all';

const elems = {
  grid: document.getElementById('coinGrid'),
  resultInfo: document.getElementById('resultInfo'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  spotlight: document.getElementById('spotlight'),
  statCount: document.getElementById('statCount'),
  statYears: document.getElementById('statYears'),
  statMint: document.getElementById('statMint'),
  statCountries: document.getElementById('statCountries'),
  dialog: document.getElementById('coinDialog'),
  dialogContent: document.getElementById('dialogContent'),
  closeDialogBtn: document.getElementById('closeDialogBtn'),
  randomCoinBtn: document.getElementById('randomCoinBtn'),
  showPrototypeBtn: document.getElementById('showPrototypeBtn'),
  intro: document.getElementById('vaultIntro'),
  introDoor: document.getElementById('introDoor')
};

window.addEventListener('load', () => {
  setTimeout(() => elems.introDoor.classList.add('opening-sequence'), 250);
  setTimeout(() => {
    elems.intro.classList.add('hidden');
    document.body.classList.add('page-ready');
  }, 2350);
});

fetch('coins.json')
  .then(r => r.json())
  .then(coins => {
    allCoins = coins.map((coin, index) => ({ ...coin, import_order: index + 1 }));
    updateStats();
    applyFilters();
    renderSpotlight(coinOfTheDay());
  });

for (const chip of document.querySelectorAll('.chip')) {
  chip.addEventListener('click', () => {
    for (const c of document.querySelectorAll('.chip')) c.classList.remove('active');
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
}

elems.searchInput.addEventListener('input', applyFilters);
elems.sortSelect.addEventListener('change', applyFilters);
elems.closeDialogBtn.addEventListener('click', () => elems.dialog.close());
elems.dialog.addEventListener('click', event => {
  const rect = elems.dialog.getBoundingClientRect();
  const inDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
  if (!inDialog) elems.dialog.close();
});

elems.randomCoinBtn.addEventListener('click', () => {
  const pool = filteredCoins.length ? filteredCoins : allCoins;
  const coin = pool[Math.floor(Math.random() * pool.length)];
  if (!coin) return;
  renderSpotlight(coin);
  openDialog(coin.id);
});

elems.showPrototypeBtn.addEventListener('click', () => {
  const coin = coinOfTheDay();
  renderSpotlight(coin);
  openDialog(coin.id);
});

function updateStats() {
  elems.statCount.textContent = allCoins.length;
  const years = allCoins.map(c => c.year).filter(Boolean).sort((a, b) => a - b);
  elems.statYears.textContent = years.length ? `${years[0]}–${years[years.length - 1]}` : 'Unknown';
  elems.statMint.textContent = allCoins.filter(c => (c.condition || '').startsWith('MS')).length;
  elems.statCountries.textContent = new Set(allCoins.map(c => c.country).filter(Boolean)).size;
}

function coinOfTheDay() {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (const ch of key) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
  return allCoins[Math.abs(hash) % allCoins.length];
}

function applyFilters() {
  const query = elems.searchInput.value.trim().toLowerCase();
  filteredCoins = allCoins.filter(coin => {
    const hay = `${coin.title} ${coin.display_name} ${coin.edition} ${coin.year} ${coin.country || ''}`.toLowerCase();
    const matchesQuery = hay.includes(query);
    let matchesFilter = true;
    switch (activeFilter) {
      case 'mint': matchesFilter = (coin.condition || '').startsWith('MS'); break;
      case 'netherlands': matchesFilter = coin.country === 'Nederland'; break;
      case 'prototype': matchesFilter = coin.prototype; break;
      case '2011': matchesFilter = coin.year === 2011; break;
      default: matchesFilter = true;
    }
    return matchesQuery && matchesFilter;
  });

  const sortValue = elems.sortSelect.value;
  filteredCoins.sort((a, b) => {
    if (sortValue === 'name') return a.display_name.localeCompare(b.display_name);
    if (sortValue === 'year-desc') return (b.year || 0) - (a.year || 0) || a.display_name.localeCompare(b.display_name);
    if (sortValue === 'year-asc') return (a.year || 9999) - (b.year || 9999) || a.display_name.localeCompare(b.display_name);
    return a.import_order - b.import_order;
  });

  renderGrid(filteredCoins);
  elems.resultInfo.textContent = `${filteredCoins.length} artifact${filteredCoins.length === 1 ? '' : 's'} shown from ${allCoins.length} archived item${allCoins.length === 1 ? '' : 's'}.`;
}

function renderGrid(coins) {
  elems.grid.innerHTML = coins.map((coin, idx) => {
    const sector = `V59-A${String(idx + 1).padStart(2, '0')}`;
    return `
      <article class="coin-card" data-id="${coin.id}" data-sector="${sector}">
        <img class="coin-art" src="${coin.image}" alt="${escapeHtml(coin.title)}" loading="lazy">
        <div class="coin-body">
          <h3 class="coin-title">${escapeHtml(coin.display_name)}</h3>
          <div class="coin-sub">${escapeHtml(coin.edition || 'No edition text imported')}</div>
          <div class="card-foot">
            <span class="badge">${escapeHtml(coin.condition_short || '—')}</span>
            <span class="badge year-pill">${coin.year || 'Unknown'}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  for (const card of elems.grid.querySelectorAll('.coin-card')) {
    card.addEventListener('click', () => {
      const coin = allCoins.find(c => c.id === card.dataset.id);
      renderSpotlight(coin);
      openDialog(card.dataset.id, card.dataset.sector);
    });
  }
}

function renderSpotlight(coin) {
  if (!coin) return;
  elems.spotlight.innerHTML = `
    <div class="spotlight-card">
      <img src="${coin.image}" alt="${escapeHtml(coin.title)}">
      <h3>${escapeHtml(coin.display_name)}</h3>
      <p class="coin-sub">${escapeHtml(coin.edition || 'No edition text imported')}</p>
      <div class="meta-list">
        <div class="meta-item"><label>Year</label><strong>${coin.year || 'Unknown'}</strong></div>
        <div class="meta-item"><label>Condition</label><strong>${escapeHtml(coin.condition_short || '—')}</strong></div>
        <div class="meta-item"><label>Origin</label><strong>${escapeHtml(coin.country || '—')}</strong></div>
        <div class="meta-item"><label>Status</label><strong>${coin.prototype ? 'Prototype' : 'Standard'}</strong></div>
      </div>
    </div>`;
}

function openDialog(id, sector = 'V59-ARC') {
  const coin = allCoins.find(c => c.id === id);
  if (!coin) return;
  elems.dialogContent.innerHTML = `
    <div class="dialog-wrap">
      <div class="dialog-image">
        <img src="${coin.image}" alt="${escapeHtml(coin.title)}">
      </div>
      <div class="dialog-copy">
        <p class="eyebrow">Vault 59 terminal inspection</p>
        <h3>${escapeHtml(coin.title)}</h3>
        <p>This archive entry is part of Vault 59 V3. Later we can expand this inspection screen with front/back images, rarity notes, acquisition info, duplicates, and private collector notes.</p>
        <div class="dialog-tags">
          <span class="badge">Sector ${sector}</span>
          <span class="badge">Archive ID ${coin.id}</span>
          <span class="badge">${escapeHtml(coin.condition || 'Condition unknown')}</span>
          ${coin.prototype ? '<span class="badge">Prototype</span>' : ''}
          ${coin.country ? `<span class="badge">${escapeHtml(coin.country)}</span>` : ''}
        </div>
        <div class="info-grid">
          <div class="info-box"><label>Display name</label><strong>${escapeHtml(coin.display_name)}</strong></div>
          <div class="info-box"><label>Edition / finish</label><strong>${escapeHtml(coin.edition || '—')}</strong></div>
          <div class="info-box"><label>Year</label><strong>${coin.year || 'Unknown'}</strong></div>
          <div class="info-box"><label>Source</label><strong>${escapeHtml(coin.source)}</strong></div>
          <div class="info-box"><label>Sector</label><strong>Geocoin archive</strong></div>
          <div class="info-box"><label>Future upgrade</label><strong>Front/back photos + collector notes</strong></div>
        </div>
      </div>
    </div>`;
  elems.dialog.showModal();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
