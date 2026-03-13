/* ─── Helpers ────────────────────────────────────────────────────────── */
async function load(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* ─── Icons (inline SVG) ─────────────────────────────────────────────── */
const ICONS = {
  twitter:       `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  github:        `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  linkedin:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  email:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  scholar:       `📚`,
  researchgate:  `🔬`,
  orcid:         `🆔`,
  pdf:           `📄`,
};

/* ─── Profile ────────────────────────────────────────────────────────── */
function renderProfile(p) {
  document.title = p.name;

  // Avatar
  const wrap = document.getElementById('avatar-wrap');
  if (p.avatar) {
    const img = document.createElement('img');
    img.src = p.avatar;
    img.alt = p.name;
    img.onerror = () => {}; // keep placeholder if missing
    wrap.innerHTML = '';
    wrap.appendChild(img);
  }

  document.getElementById('profile-name').textContent = p.name;
  document.getElementById('profile-name-zh').textContent = p.name_zh || '';
  document.getElementById('tagline').textContent = p.tagline || '';

  // Bio
  document.getElementById('bio-text').textContent = p.bio;

  // Interests
  const intEl = document.getElementById('interests');
  if (p.interests && p.interests.length) {
    intEl.innerHTML = p.interests.map(i => `<span>${i}</span>`).join('');
  }

  // Social links (icon only)
  const socEl = document.getElementById('social-links');
  const socMap = [
    { key: 'twitter',  label: 'Twitter'  },
    { key: 'github',   label: 'GitHub'   },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'email',    label: 'Email'    },
  ];
  socMap.forEach(({ key, label }) => {
    const url = p.links?.[key];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.title = label;
    a.target = key !== 'email' ? '_blank' : undefined;
    a.rel = 'noopener noreferrer';
    a.innerHTML = ICONS[key] || label;
    socEl.appendChild(a);
  });

  // Academic links
  const acEl = document.getElementById('academic-links');
  const acMap = [
    { key: 'google_scholar', icon: ICONS.scholar,      label: 'Google Scholar'  },
    { key: 'researchgate',   icon: ICONS.researchgate,  label: 'ResearchGate'    },
    { key: 'orcid',          icon: ICONS.orcid,          label: 'ORCID'           },
  ];
  acMap.forEach(({ key, icon, label }) => {
    const url = p.links?.[key];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<span>${icon}</span> ${label}`;
    acEl.appendChild(a);
  });

  // CV link
  if (p.links?.cv) {
    const cvA = document.createElement('a');
    cvA.href = p.links.cv;
    cvA.className = 'cv-link';
    cvA.target = '_blank';
    cvA.innerHTML = `${ICONS.pdf} Curriculum Vitae`;
    acEl.appendChild(cvA);
    // Also update section cv-link
    const cvBtn = document.getElementById('cv-link');
    if (cvBtn) cvBtn.href = p.links.cv;
  }

  // Footer
  const year = new Date().getFullYear();
  const ftEl = document.getElementById('footer-text');
  if (ftEl) ftEl.textContent = `© 2022–${year} ${p.name}${p.name_zh ? ' (' + p.name_zh + ')' : ''}`;
}

/* ─── News ───────────────────────────────────────────────────────────── */
function renderNews(news) {
  const list = document.getElementById('news-list');
  list.innerHTML = '';
  news.forEach(item => {
    const div = el('div', 'news-item');
    div.innerHTML = `
      <span class="news-date">${item.date}</span>
      <span class="news-text">
        ${item.content}
        ${item.link_url ? `<a href="${item.link_url}" target="_blank" rel="noopener">${item.link_text}</a>` : item.link_text || ''}
        ${item.suffix || ''}
      </span>
    `;
    list.appendChild(div);
  });
}

/* ─── Publications ───────────────────────────────────────────────────── */
const TYPE_LABEL = { journal: 'Journal', conference: 'Conference', 'under-review': 'Under Review' };
const TYPE_TYPES = ['journal', 'conference', 'under-review'];

function renderPublications(pubs) {
  // Build type filters (only types present among featured papers)
  const presentTypes = TYPE_TYPES.filter(t => pubs.some(p => p.featured && p.type === t));

  const filtersEl = document.getElementById('pub-filters');
  filtersEl.innerHTML = '';
  const allBtn = el('button', 'filter-btn active', 'All');
  allBtn.dataset.filter = 'all';
  filtersEl.appendChild(allBtn);

  presentTypes.forEach(type => {
    const btn = el('button', 'filter-btn', TYPE_LABEL[type] || type);
    btn.dataset.filter = type;
    filtersEl.appendChild(btn);
  });

  filtersEl.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filtersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.pub-card').forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.type !== filter);
    });
  });

  // Cards — homepage shows only featured papers
  const listEl = document.getElementById('pub-list');
  listEl.innerHTML = '';
  pubs.filter(p => p.featured).forEach(p => {
    const card = el('div', 'pub-card');
    card.dataset.type = p.type || '';

    const mainLinks = [];
    if (p.url)  mainLinks.push(`<a class="pub-link" href="${p.url}" target="_blank">paper</a>`);
    if (p.pdf)  mainLinks.push(`<a class="pub-link" href="${p.pdf}" target="_blank">pdf</a>`);
    if (p.code) mainLinks.push(`<a class="pub-link" href="${p.code}" target="_blank">code</a>`);
    if (p.demo) mainLinks.push(`<a class="pub-link pub-link-demo" href="${p.demo}" target="_blank">demo ↗</a>`);

    card.innerHTML = `
      <div class="pub-body">
        <div class="pub-title"><a href="${p.url || '#'}" target="_blank">${p.title}</a></div>
        <div class="pub-authors">${p.authors}</div>
        <div class="pub-venue">${p.venue}</div>
        <div class="pub-tags">${(p.tags || []).map(t => `<span class="pub-tag">${t}</span>`).join('')}</div>
        <div class="pub-links">${mainLinks.join('')}</div>
      </div>
      <span class="pub-year-badge">${p.year}</span>
    `;
    listEl.appendChild(card);
  });
}

/* ─── Research ───────────────────────────────────────────────────────── */
function renderResearch(research) {
  const grid = document.getElementById('research-grid');
  grid.innerHTML = '';
  research.forEach(r => {
    const card = el('div', 'research-card');
    card.innerHTML = `
      <div class="research-icon">${r.icon}</div>
      <div class="research-title">${r.title}</div>
      <p class="research-desc">${r.description}</p>
      <div class="research-tags">${(r.tags || []).map(t => `<span class="research-tag">${t}</span>`).join('')}</div>
      ${r.demo ? `<a class="research-demo-link" href="${r.demo}" target="_blank" rel="noopener">Try it ↗</a>` : ''}
    `;
    grid.appendChild(card);
  });
}

/* ─── Beyond Research ────────────────────────────────────────────────── */
const INTEREST_ICONS = {
  'Trail running/Marathon': '🏃',
  'Rowing':                 '🚣',
  'Cycling':                '🚴',
};

function renderBeyond(profile, races) {
  // Interest cards
  const intEl = document.getElementById('beyond-interests');
  if (intEl && profile.interests) {
    intEl.innerHTML = '';
    profile.interests.forEach(name => {
      const card = el('div', 'beyond-interest-card');
      card.innerHTML = `<span class="int-icon">${INTEREST_ICONS[name] || '◈'}</span><span>${name}</span>`;
      intEl.appendChild(card);
    });
  }

  // Leaflet map
  const mapEl = document.getElementById('race-map');
  if (!mapEl || !window.L) return;

  const center = [46.5, 9.0];
  const map = L.map('race-map', { zoomControl: true, scrollWheelZoom: false }).setView(center, 5);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18,
  }).addTo(map);

  const finishedIcon = L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#2d8a8a;border:2.5px solid #fff;box-shadow:0 0 0 1.5px #2d8a8a,0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });
  const dnfIcon = L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#b0ada6;border:2px solid #fff;box-shadow:0 0 0 1px #b0ada6,0 1px 4px rgba(0,0,0,0.25)"></div>`,
    iconSize: [12, 12], iconAnchor: [6, 6],
  });

  races.forEach(r => {
    const isDNF = r.time === 'DNF';
    const marker = L.marker([r.lat, r.lng], { icon: isDNF ? dnfIcon : finishedIcon });
    marker.bindPopup(`
      <div class="race-popup-name">${r.flag} ${r.short}</div>
      <div class="race-popup-meta">${r.name}</div>
      <div class="race-popup-meta">${r.date} · ${r.distance} / ${r.elevation}</div>
      <div class="race-popup-score">${isDNF ? 'DNF' : `${r.time} · Score ${r.score}`}</div>
    `);
    marker.addTo(map);
  });

  // Race list
  const listEl = document.getElementById('race-list');
  if (listEl) {
    listEl.innerHTML = '';
    races.forEach(r => {
      const isDNF = r.time === 'DNF';
      const item = el('div', 'race-item');
      item.innerHTML = `
        <span class="race-item-date">${r.date.slice(0, 7)}</span>
        <span class="race-item-name">${r.flag} ${r.short}<small>${r.name}</small></span>
        <span class="race-item-dist">${r.distance} / ${r.elevation}</span>
        <span class="race-item-time ${isDNF ? 'dnf' : ''}">${r.time}</span>
      `;
      item.addEventListener('click', () => map.setView([r.lat, r.lng], 9, { animate: true }));
      listEl.appendChild(item);
    });
  }
}

/* ─── Travel Map ─────────────────────────────────────────────────────── */
function renderTravel(data) {
  // Support both a plain array and the {cities: [...]} wrapper format
  const cities = Array.isArray(data) ? data : (data.cities || []);

  // Stats line
  const statsEl = document.getElementById('travel-stats');
  if (statsEl) {
    const countries = new Set(cities.map(c => c.country)).size;
    const continents = [...new Set(cities.map(c => c.continent))].join(' & ');
    statsEl.textContent = `${cities.length} cities · ${countries} countries · ${continents}`;
  }

  const mapEl = document.getElementById('travel-map');
  if (!mapEl || !window.L) return;

  const map = L.map('travel-map', { zoomControl: true, scrollWheelZoom: false });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18,
  }).addTo(map);

  // Fit bounds to all cities
  const bounds = L.latLngBounds(cities.map(c => [c.latitude, c.longitude]));
  map.fitBounds(bounds, { padding: [24, 24], maxZoom: 5 });

  // Log-scale dot sizing
  const logCounts = cities.map(c => Math.log(c.point_count + 1));
  const minL = Math.min(...logCounts);
  const maxL = Math.max(...logCounts);

  cities.forEach(c => {
    const t = (Math.log(c.point_count + 1) - minL) / (maxL - minL);
    const r = Math.round(3 + t * 9); // radius 3–12 px
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:rgba(100,120,200,0.55);border:1.5px solid rgba(100,120,200,0.85);box-shadow:0 1px 3px rgba(0,0,0,0.18);"></div>`,
      iconSize: [r * 2, r * 2],
      iconAnchor: [r, r],
    });
    L.marker([c.latitude, c.longitude], { icon })
      .bindTooltip(`<strong>${c.name}</strong><br>${c.country}`, { direction: 'top', offset: [0, -r] })
      .addTo(map);
  });
}

/* ─── Talks (homepage preview) ───────────────────────────────────────── */
function renderTalksPreview(talks) {
  const el = document.getElementById('talks-preview');
  if (!el) return;
  el.innerHTML = '';
  talks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'talk-preview-item';
    item.innerHTML = `
      <div class="talk-preview-meta">
        <span class="talk-preview-event">${t.event}</span>
        <span class="talk-preview-year">${t.year}</span>
        <span class="talk-preview-type">${t.type}</span>
      </div>
      <div class="talk-preview-title">${t.title}</div>
      <div class="talk-preview-topic">${t.topic}</div>
    `;
    el.appendChild(item);
  });
}

/* ─── Init ───────────────────────────────────────────────────────────── */
async function init() {
  try {
    const [profile, news, publications, research, races, talks] = await Promise.all([
      load('data/profile.json'),
      load('data/news.json'),
      load('data/publications.json'),
      load('data/research.json'),
      load('data/races.json'),
      load('data/talks.json'),
    ]);
    renderProfile(profile);
    renderNews(news);
    renderPublications(publications);
    renderTalksPreview(talks);
    renderResearch(research);
    renderBeyond(profile, races);
  } catch (err) {
    console.error('Failed to load data:', err);
  }

  // Travel map loaded separately so a fetch failure doesn't break other sections
  try {
    const cities = await load('data/visited_cities.json');
    renderTravel(cities);
  } catch (err) {
    console.error('Failed to load visited_cities:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);
