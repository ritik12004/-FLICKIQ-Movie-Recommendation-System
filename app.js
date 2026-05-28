/* ─────────────────────────────────────────
   FLICKIQ — app.js
   ───────────────────────────────────────── */

const API_BASE   =  "https://flickiq-movie-recommendation-system-1.onrender.com";
const TMDB_IMG   = "https://image.tmdb.org/t/p/w500";
const TMDB_BG    = "https://image.tmdb.org/t/p/w780";

const POPULAR = [
  "The Dark Knight", "Inception", "Interstellar", "The Matrix",
  "Pulp Fiction", "Fight Club", "Forrest Gump", "The Godfather",
  "Goodfellas", "Schindler's List", "The Shawshank Redemption",
  "Avengers", "Titanic", "Avatar", "Toy Story", "Parasite",
  "The Silence of the Lambs", "Jurassic Park", "The Lion King",
];

// ── State ──────────────────────────────────────────────────────────────────
let topN         = 10;
let currentModal = null;

// ── DOM Refs ───────────────────────────────────────────────────────────────
const searchInput    = document.getElementById("searchInput");
const searchBtn      = document.getElementById("searchBtn");
const suggestionsEl  = document.getElementById("suggestions");
const countBtns      = document.getElementById("countBtns");
const statusBar      = document.getElementById("statusBar");
const statusMsg      = document.getElementById("statusMsg");
const errorMsg       = document.getElementById("errorMsg");
const errorText      = document.getElementById("errorText");
const nowShowing     = document.getElementById("nowShowing");
const nowPoster      = document.getElementById("nowPoster");
const nowTitle       = document.getElementById("nowTitle");
const nowMeta        = document.getElementById("nowMeta");
const resultsHeader  = document.getElementById("resultsHeader");
const resultsCount   = document.getElementById("resultsCount");
const grid           = document.getElementById("grid");
const emptyState     = document.getElementById("emptyState");
const modalBackdrop  = document.getElementById("modalBackdrop");
const modalClose     = document.getElementById("modalClose");
const modalImg       = document.getElementById("modalImg");
const modalGenre     = document.getElementById("modalGenre");
const modalTitle     = document.getElementById("modalTitle");
const modalMeta      = document.getElementById("modalMeta");
const modalOverview  = document.getElementById("modalOverview");
const modalRecommBtn = document.getElementById("modalRecommendBtn");

// ══════════════════════════════════════════
// API CALLS
// ══════════════════════════════════════════

async function fetchRecommendations(title, n) {
  const url = `${API_BASE}/recommend/tfidf?title=${encodeURIComponent(title)}&top_n=${n}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }
  return res.json();
}

async function fetchTMDB(query) {
  try {
    const res = await fetch(`${API_BASE}/tmdb/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0] || null;
  } catch {
    return null;
  }
}

async function enrichWithTMDB(recs) {
  return Promise.all(
    recs.map(async (item) => {
      const tmdb = await fetchTMDB(item.title);
      return { ...item, tmdb };
    })
  );
}

// ══════════════════════════════════════════
// SEARCH FLOW
// ══════════════════════════════════════════

async function handleSearch(titleOverride) {
  const title = (titleOverride || searchInput.value).trim();
  if (!title) return;

  hideSuggestions();
  hideError();
  showStatus(`Searching for films similar to "${title}"…`);
  showSkeleton();
  hideNowShowing();
  hideResults();
  hideEmpty();
  searchBtn.disabled = true;

  try {
    const recs = await fetchRecommendations(title, topN);
    showStatus(`Enriching ${recs.length} results with TMDB data…`);

    const [enriched, selTMDB] = await Promise.all([
      enrichWithTMDB(recs),
      fetchTMDB(title),
    ]);

    renderNowShowing(title, selTMDB);
    renderGrid(enriched);
    hideStatus();
  } catch (err) {
    hideStatus();
    showError(err.message || "Something went wrong. Make sure the title matches exactly what's in the dataset.");
    showEmpty("NO RESULTS", "Try a different title or check the spelling.");
  } finally {
    searchBtn.disabled = false;
    grid.innerHTML !== "" && hideEmpty();
  }
}

// ══════════════════════════════════════════
// RENDER — NOW SHOWING
// ══════════════════════════════════════════

function renderNowShowing(title, tmdb) {
  nowTitle.textContent = title;

  if (tmdb?.poster_path) {
    nowPoster.innerHTML = `<img class="now-poster" src="${TMDB_IMG}${tmdb.poster_path}" alt="${title}" />`;
  } else {
    nowPoster.innerHTML = `<div class="now-poster-placeholder">🎬</div>`;
  }

  const year  = tmdb?.release_date?.slice(0, 4) || "";
  const score = tmdb?.vote_average ? `★ ${tmdb.vote_average.toFixed(1)}` : "";
  nowMeta.textContent = [year, score].filter(Boolean).join(" · ");

  nowShowing.style.display = "flex";
}

// ══════════════════════════════════════════
// RENDER — GRID
// ══════════════════════════════════════════

function renderGrid(items) {
  grid.innerHTML = "";

  if (!items.length) {
    showEmpty("NO RESULTS", "Try a different title or check the spelling.");
    return;
  }

  resultsCount.textContent = `${items.length} results`;
  resultsHeader.style.display = "flex";

  items.forEach((item, i) => {
    const card = buildCard(item, i);
    grid.appendChild(card);
  });
}

function buildCard(item, index) {
  const score   = Math.round(item.score * 100);
  const tmdb    = item.tmdb;
  const poster  = tmdb?.poster_path ? `${TMDB_IMG}${tmdb.poster_path}` : null;

  const card = document.createElement("div");
  card.className = "card";
  card.style.animationDelay = `${(index + 1) * 0.03}s`;

  card.innerHTML = `
    <div class="card-poster-wrap">
      ${poster
        ? `<img class="card-poster" src="${poster}" alt="${escHtml(item.title)}" loading="lazy" />`
        : `<div class="card-poster-ph">🎬</div>`
      }
      <div class="score-badge">${score}%</div>
      <button class="card-overlay-btn">DETAILS</button>
    </div>
    <div class="card-body">
      <div class="card-title">${escHtml(item.title)}</div>
      <div class="card-score">
        <span>${score}% match</span>
        <div class="match-bar-wrap">
          <div class="match-bar" style="width:${score}%"></div>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", () => openModal(item));
  return card;
}

// ══════════════════════════════════════════
// SKELETON LOADER
// ══════════════════════════════════════════

function showSkeleton() {
  grid.innerHTML = "";
  resultsHeader.style.display = "none";
  const wrap = document.createElement("div");
  wrap.className = "skeleton-grid";
  for (let i = 0; i < topN; i++) {
    wrap.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton-poster"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    `;
  }
  grid.appendChild(wrap);
}

// ══════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════

function openModal(item) {
  currentModal = item;
  const tmdb = item.tmdb;

  // Image
  const bg = tmdb?.backdrop_path
    ? `<img class="modal-backdrop-img" src="${TMDB_BG}${tmdb.backdrop_path}" alt="" />`
    : tmdb?.poster_path
      ? `<img class="modal-backdrop-img" src="${TMDB_IMG}${tmdb.poster_path}" alt="" style="object-position:top" />`
      : `<div class="modal-backdrop-ph">🎬</div>`;

  modalImg.innerHTML      = bg;
  modalTitle.textContent  = item.title;
  modalGenre.textContent  = tmdb?.vote_average ? `★ ${tmdb.vote_average.toFixed(1)}` : "FILM";
  modalOverview.textContent = tmdb?.overview || "";

  // Meta
  const year  = tmdb?.release_date?.slice(0, 4);
  const match = `${Math.round(item.score * 100)}% match`;
  modalMeta.innerHTML = year
    ? `<span>${year}</span><span style="opacity:.3">|</span><span>${match}</span>`
    : `<span>${match}</span>`;

  // Recommend btn
  modalRecommBtn.onclick = () => {
    closeModal();
    searchInput.value = item.title;
    handleSearch(item.title);
  };

  modalBackdrop.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalBackdrop.style.display = "none";
  document.body.style.overflow = "";
  currentModal = null;
}

// ══════════════════════════════════════════
// SUGGESTIONS
// ══════════════════════════════════════════

function updateSuggestions(val) {
  const q = val.trim().toLowerCase();
  if (q.length < 2) { hideSuggestions(); return; }

  const matches = POPULAR.filter(t => t.toLowerCase().includes(q)).slice(0, 6);
  if (!matches.length) { hideSuggestions(); return; }

  suggestionsEl.innerHTML = matches.map(m =>
    `<div class="suggestion-item" data-title="${escHtml(m)}">
      <span class="sug-icon">▸</span>${escHtml(m)}
    </div>`
  ).join("");

  suggestionsEl.classList.add("open");
}

function hideSuggestions() {
  suggestionsEl.classList.remove("open");
  suggestionsEl.innerHTML = "";
}

// ══════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════

function showStatus(msg)  { statusMsg.textContent = msg; statusBar.style.display = "flex"; }
function hideStatus()     { statusBar.style.display = "none"; }
function showError(msg)   { errorText.textContent = msg; errorMsg.style.display = "flex"; }
function hideError()      { errorMsg.style.display = "none"; }
function hideNowShowing() { nowShowing.style.display = "none"; }
function hideResults()    { resultsHeader.style.display = "none"; grid.innerHTML = ""; }
function hideEmpty()      { emptyState.style.display = "none"; }
function showEmpty(title, msg) {
  emptyState.querySelector(".empty-title").textContent = title || "READY TO DISCOVER";
  emptyState.querySelector(".empty-msg").innerHTML = msg || `Type any movie title above and hit <strong>FIND FILMS</strong> to get personalized recommendations.`;
  emptyState.style.display = "flex";
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ══════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════

// Search button
searchBtn.addEventListener("click", () => handleSearch());

// Enter key
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter")  handleSearch();
  if (e.key === "Escape") hideSuggestions();
});

// Suggestions — type
searchInput.addEventListener("input", (e) => updateSuggestions(e.target.value));

// Suggestions — click
suggestionsEl.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");
  if (!item) return;
  const title = item.dataset.title;
  searchInput.value = title;
  hideSuggestions();
  handleSearch(title);
});

// Close suggestions on outside click
document.addEventListener("mousedown", (e) => {
  if (!suggestionsEl.contains(e.target) && e.target !== searchInput) {
    hideSuggestions();
  }
});

// Result count buttons
countBtns.addEventListener("click", (e) => {
  const btn = e.target.closest(".count-btn");
  if (!btn) return;
  document.querySelectorAll(".count-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  topN = parseInt(btn.dataset.n, 10);
});

// Modal close
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// Escape closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentModal) closeModal();
});
