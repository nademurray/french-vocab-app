'use strict';

// ============================================================
// State
// ============================================================
const state = {
  screen: 'capture',
  cards: [],
  settings: { apiKey: '' },
  form: {
    word: '',
    ipa: '',
    englishEquivalent: '',
    frenchDefinition: '',
    exampleSentence: '',
    register: 'standard',
    notes: '',
    source: '',
    populated: false,
  },
  review: {
    queue: [],
    index: 0,
    flipped: false,
  },
  deck: {
    search: '',
    expandedId: null,
  },
  loading: false,
  error: null,
  toastTimer: null,
};

// ============================================================
// Storage
// ============================================================
function loadData() {
  try {
    state.cards = JSON.parse(localStorage.getItem('fva_cards') || '[]');
  } catch (_) {
    state.cards = [];
  }
  try {
    state.settings = JSON.parse(localStorage.getItem('fva_settings') || '{"apiKey":""}');
  } catch (_) {
    state.settings = { apiKey: '' };
  }
}

function saveCards() {
  localStorage.setItem('fva_cards', JSON.stringify(state.cards));
}

function saveSettings() {
  localStorage.setItem('fva_settings', JSON.stringify(state.settings));
}

// ============================================================
// Utilities
// ============================================================
function today() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, isError = false) {
  clearTimeout(state.toastTimer);
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  state.toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ============================================================
// SM-2 Algorithm
// ============================================================
function applySM2(card, rating) {
  // Map 1-5 user rating to SM-2 quality 0-5
  const qualityMap = [0, 1, 3, 4, 5];
  const q = qualityMap[rating - 1];
  let { repetitions, easeFactor, interval } = card.sm2;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
    easeFactor += 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    easeFactor = Math.max(1.3, Math.round(easeFactor * 1000) / 1000);
  }

  card.sm2 = {
    repetitions,
    easeFactor,
    interval,
    nextReview: addDays(today(), interval),
  };
}

// ============================================================
// Claude API
// ============================================================
async function lookupWord(word) {
  if (!state.settings.apiKey) {
    throw new Error('No API key set. Go to Settings and enter your Claude API key.');
  }

  const prompt =
    'You are a French dictionary. Given the French word or phrase below, ' +
    'return ONLY a valid JSON object — no markdown, no explanation, no code fences. ' +
    'Use exactly these keys:\n' +
    '- ipa: IPA pronunciation string\n' +
    '- englishEquivalent: concise English translation (1-5 words)\n' +
    '- frenchDefinition: definition in French (1-2 sentences)\n' +
    '- exampleSentence: one literary or contemporary example sentence in French\n' +
    '- register: exactly one of: "literary", "formal", "standard", "spoken", "colloquial"\n\n' +
    'Word: ' + word;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await res.json();
  const raw = data.content[0].text.trim();
  // Strip markdown code fences if Claude wraps the JSON anyway
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(jsonStr);
}

// ============================================================
// Navigation
// ============================================================
function navigate(screen) {
  state.screen = screen;
  state.error = null;

  if (screen === 'review') {
    const t = today();
    const due = state.cards.filter(c => c.sm2.nextReview <= t);
    // Shuffle Fisher-Yates
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    state.review = { queue: due, index: 0, flipped: false };
  }

  render();
  window.scrollTo(0, 0);
}

// ============================================================
// Rendering
// ============================================================
function render() {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  appEl.innerHTML = buildScreen() + buildTabBar() + buildToast();
  restoreFocus();
}

function restoreFocus() {
  if (state.screen === 'capture') {
    const input = document.getElementById('word-input');
    if (input && document.activeElement !== input) input.focus();
  }
}

function buildToast() {
  return '<div id="toast" class="toast"></div>';
}

function buildTabBar() {
  const tabs = [
    { id: 'capture',  label: 'Capture',  icon: '&#43;' },
    { id: 'review',   label: 'Review',   icon: '&#8635;' },
    { id: 'deck',     label: 'Deck',     icon: '&#9776;' },
    { id: 'settings', label: 'Settings', icon: '&#9881;' },
  ];
  return (
    '<nav class="tab-bar" role="navigation" aria-label="Main navigation">' +
    tabs.map(t =>
      `<button class="tab-btn${state.screen === t.id ? ' active' : ''}" ` +
      `data-action="navigate" data-screen="${t.id}" aria-label="${t.label}" ` +
      `aria-current="${state.screen === t.id ? 'page' : 'false'}">` +
      `<span class="tab-icon" aria-hidden="true">${t.icon}</span>` +
      `<span class="tab-label">${t.label}</span>` +
      `</button>`
    ).join('') +
    '</nav>'
  );
}

function buildScreen() {
  switch (state.screen) {
    case 'capture':  return buildCapture();
    case 'review':   return buildReview();
    case 'deck':     return buildDeck();
    case 'settings': return buildSettings();
    default:         return buildCapture();
  }
}

// ---- Capture ----
function buildCapture() {
  const f = state.form;
  return (
    '<main class="screen" id="screen-capture">' +
    '<header class="screen-header"><h1>Capture</h1></header>' +
    '<div class="capture-body">' +
    '<div class="lookup-row">' +
    `<input id="word-input" class="word-input" type="text" ` +
    `placeholder="French word or phrase…" value="${esc(f.word)}" ` +
    `data-action="update-word" autocomplete="off" autocorrect="off" ` +
    `autocapitalize="none" spellcheck="false" aria-label="French word or phrase" />` +
    `<button class="btn-primary lookup-btn" data-action="lookup"${state.loading ? ' disabled' : ''} aria-label="Look up word">` +
    (state.loading ? '<span class="spinner" aria-hidden="true"></span> Looking up…' : 'Look it up') +
    '</button>' +
    '</div>' +
    (state.error ? `<p class="error-msg" role="alert">${esc(state.error)}</p>` : '') +
    (f.populated ? buildCaptureForm() : '') +
    '</div>' +
    '</main>'
  );
}

function buildCaptureForm() {
  const f = state.form;
  const registers = ['literary', 'formal', 'standard', 'spoken', 'colloquial'];
  return (
    '<div class="card-form">' +
    field('IPA', 'input', 'ipa', f.ipa, '/prɔ̃.sja.sjɔ̃/') +
    field('English', 'input', 'englishEquivalent', f.englishEquivalent, 'English meaning') +
    field('French definition', 'textarea', 'frenchDefinition', f.frenchDefinition, 'Définition en français…') +
    field('Example sentence', 'textarea', 'exampleSentence', f.exampleSentence, 'Phrase d’exemple…') +
    `<div class="form-group">` +
    `<label for="field-register">Register</label>` +
    `<select id="field-register" data-field="register">` +
    registers.map(r => `<option value="${r}"${f.register === r ? ' selected' : ''}>${r}</option>`).join('') +
    `</select></div>` +
    fieldOpt('Notes', 'input', 'notes', f.notes, 'Personal context…') +
    fieldOpt('Source', 'input', 'source', f.source, 'Book, film, podcast…') +
    '<button class="btn-primary save-btn" data-action="save-card">Save card</button>' +
    '</div>'
  );
}

function field(label, tag, fieldName, value, placeholder) {
  const id = `field-${fieldName}`;
  const attrs = `id="${id}" data-field="${fieldName}" placeholder="${esc(placeholder)}"`;
  const el = tag === 'textarea'
    ? `<textarea ${attrs} rows="2">${esc(value)}</textarea>`
    : `<input type="text" ${attrs} value="${esc(value)}" />`;
  return `<div class="form-group"><label for="${id}">${label}</label>${el}</div>`;
}

function fieldOpt(label, tag, fieldName, value, placeholder) {
  const id = `field-${fieldName}`;
  const attrs = `id="${id}" data-field="${fieldName}" placeholder="${esc(placeholder)}"`;
  const el = tag === 'textarea'
    ? `<textarea ${attrs} rows="2">${esc(value)}</textarea>`
    : `<input type="text" ${attrs} value="${esc(value)}" />`;
  return (
    `<div class="form-group">` +
    `<label for="${id}">${label} <span class="optional">optional</span></label>` +
    `${el}</div>`
  );
}

// ---- Review ----
function buildReview() {
  const { queue, index, flipped } = state.review;

  if (queue.length === 0) {
    const upcoming = state.cards
      .map(c => c.sm2.nextReview)
      .filter(Boolean)
      .sort()[0];
    return (
      '<main class="screen" id="screen-review">' +
      '<header class="screen-header"><h1>Review</h1></header>' +
      '<div class="review-empty">' +
      '<div class="empty-icon" aria-hidden="true">✓</div>' +
      '<p>No cards due today.</p>' +
      (upcoming ? `<p class="next-due">Next review: ${esc(upcoming)}</p>` : '') +
      (state.cards.length === 0 ? '<p class="hint">Add words in Capture to get started.</p>' : '') +
      '</div></main>'
    );
  }

  if (index >= queue.length) {
    return (
      '<main class="screen" id="screen-review">' +
      '<header class="screen-header"><h1>Review</h1></header>' +
      '<div class="review-empty">' +
      '<div class="empty-icon" aria-hidden="true">🎉</div>' +
      `<p>Session complete — ${queue.length} card${queue.length !== 1 ? 's' : ''} reviewed.</p>` +
      '<button class="btn-secondary" data-action="restart-review">Review again</button>' +
      '</div></main>'
    );
  }

  const card = queue[index];
  return (
    '<main class="screen" id="screen-review">' +
    '<header class="screen-header">' +
    '<h1>Review</h1>' +
    `<span class="progress-label" aria-live="polite">${index + 1} / ${queue.length}</span>` +
    '</header>' +
    '<div class="review-body">' +
    `<div class="flashcard${flipped ? ' flipped' : ''}" data-action="flip-card" role="button" tabindex="0" aria-label="${flipped ? 'Card revealed' : 'Tap to reveal answer'}">` +
    '<div class="flashcard-inner">' +
    '<div class="flashcard-front">' +
    `<div class="card-word">${esc(card.word)}</div>` +
    (card.ipa ? `<div class="card-ipa">${esc(card.ipa)}</div>` : '') +
    '<div class="flip-hint">Tap to reveal</div>' +
    '</div>' +
    '<div class="flashcard-back">' +
    `<div class="card-word">${esc(card.word)}</div>` +
    (card.ipa ? `<div class="card-ipa">${esc(card.ipa)}</div>` : '') +
    `<div class="card-english">${esc(card.englishEquivalent)}</div>` +
    `<div class="card-definition">${esc(card.frenchDefinition)}</div>` +
    `<div class="card-example">“${esc(card.exampleSentence)}”</div>` +
    `<span class="register-badge ${esc(card.register)}">${esc(card.register)}</span>` +
    '</div>' +
    '</div>' +
    '</div>' +
    (flipped ? buildRatingRow() : '') +
    '</div>' +
    '</main>'
  );
}

function buildRatingRow() {
  const labels = ['Forgot', 'Hard', 'Okay', 'Good', 'Perfect'];
  return (
    '<div class="rating-row" role="group" aria-label="Rate your recall">' +
    '<p class="rating-label">How well did you know it?</p>' +
    '<div class="rating-btns">' +
    [1, 2, 3, 4, 5].map(r =>
      `<button class="rating-btn r${r}" data-action="rate" data-rating="${r}" aria-label="${labels[r - 1]}">${r}</button>`
    ).join('') +
    '</div>' +
    '<div class="rating-hints"><span>Forgot</span><span>Perfect</span></div>' +
    '</div>'
  );
}

// ---- Deck ----
function buildDeck() {
  const search = state.deck.search.toLowerCase();
  const filtered = state.cards
    .filter(c => !search || c.word.toLowerCase().includes(search))
    .sort((a, b) => a.word.localeCompare(b.word, 'fr'));

  return (
    '<main class="screen" id="screen-deck">' +
    `<header class="screen-header"><h1>Deck <span class="card-count">${state.cards.length}</span></h1></header>` +
    '<div class="deck-body">' +
    `<input class="search-input" type="search" placeholder="Search cards…" ` +
    `value="${esc(state.deck.search)}" data-action="search-deck" aria-label="Search cards" />` +
    (filtered.length === 0
      ? `<p class="deck-empty">${state.cards.length === 0 ? 'No cards yet. Add words in Capture.' : 'No results.'}</p>`
      : `<ul class="card-list" role="list">${filtered.map(buildDeckCard).join('')}</ul>`
    ) +
    '</div>' +
    '</main>'
  );
}

function buildDeckCard(card) {
  const expanded = state.deck.expandedId === card.id;
  return (
    `<li class="deck-card${expanded ? ' expanded' : ''}" data-action="toggle-card" data-id="${esc(card.id)}" role="listitem">` +
    '<div class="deck-card-header">' +
    `<span class="deck-word">${esc(card.word)}</span>` +
    '<span class="deck-meta">' +
    `<span class="register-badge ${esc(card.register)}">${esc(card.register)}</span>` +
    `<span class="next-review-label">${esc(card.sm2.nextReview)}</span>` +
    '</span>' +
    '</div>' +
    (expanded
      ? '<div class="deck-card-detail">' +
        (card.ipa ? `<div class="detail-ipa">${esc(card.ipa)}</div>` : '') +
        `<div class="detail-english">${esc(card.englishEquivalent)}</div>` +
        `<div class="detail-french">${esc(card.frenchDefinition)}</div>` +
        `<div class="detail-example">“${esc(card.exampleSentence)}”</div>` +
        (card.notes ? `<div class="detail-notes">Notes: ${esc(card.notes)}</div>` : '') +
        (card.source ? `<div class="detail-source">Source: ${esc(card.source)}</div>` : '') +
        `<div class="detail-sm2">Interval: ${card.sm2.interval}d · EF: ${card.sm2.easeFactor.toFixed(2)} · Reps: ${card.sm2.repetitions}</div>` +
        `<button class="btn-danger-sm" data-action="delete-card" data-id="${esc(card.id)}">Delete card</button>` +
        '</div>'
      : ''
    ) +
    '</li>'
  );
}

// ---- Settings ----
function buildSettings() {
  return (
    '<main class="screen" id="screen-settings">' +
    '<header class="screen-header"><h1>Settings</h1></header>' +
    '<div class="settings-body">' +
    '<section class="settings-section">' +
    '<h2>Claude API Key</h2>' +
    '<p class="settings-hint">Your key is stored only in this browser’s localStorage and sent directly to Anthropic’s API — nowhere else.</p>' +
    '<div class="api-key-row">' +
    `<input id="api-key-input" class="api-key-input" type="password" ` +
    `placeholder="sk-ant-…" value="${esc(state.settings.apiKey)}" autocomplete="off" aria-label="Claude API key" />` +
    `<button class="btn-icon" data-action="toggle-key-visibility" aria-label="Show or hide API key">👁</button>` +
    '</div>' +
    '<button class="btn-primary" data-action="save-settings">Save key</button>' +
    '</section>' +
    '<section class="settings-section">' +
    '<h2>Data</h2>' +
    `<p>${state.cards.length} card${state.cards.length !== 1 ? 's' : ''} in deck</p>` +
    '<button class="btn-secondary" data-action="export-data">Export JSON</button>' +
    '<button class="btn-danger" data-action="clear-data">Clear all data</button>' +
    '</section>' +
    '</div>' +
    '</main>'
  );
}

// ============================================================
// Event handlers
// ============================================================
function handleClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  switch (btn.dataset.action) {
    case 'navigate':
      navigate(btn.dataset.screen);
      break;
    case 'lookup':
      handleLookup();
      break;
    case 'save-card':
      handleSaveCard();
      break;
    case 'flip-card': {
      if (!state.review.flipped) {
        state.review.flipped = true;
        render();
        // Back content can be taller than the fixed 280px min-height.
        // If it overflows, it covers the rating buttons and blocks taps.
        // Expand the container to fit the actual back content height.
        const back = document.querySelector('.flashcard-back');
        const inner = document.querySelector('.flashcard-inner');
        if (back && inner) {
          inner.style.minHeight = back.scrollHeight + 'px';
        }
      }
      break;
    }
    case 'rate':
      handleRate(parseInt(btn.dataset.rating, 10));
      break;
    case 'restart-review':
      navigate('review');
      break;
    case 'toggle-card': {
      const id = btn.dataset.id;
      state.deck.expandedId = state.deck.expandedId === id ? null : id;
      render();
      break;
    }
    case 'delete-card':
      e.stopPropagation();
      handleDeleteCard(btn.dataset.id);
      break;
    case 'toggle-key-visibility': {
      const inp = document.getElementById('api-key-input');
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
      break;
    }
    case 'save-settings':
      handleSaveSettings();
      break;
    case 'export-data':
      handleExport();
      break;
    case 'clear-data':
      handleClearData();
      break;
  }
}

function handleInput(e) {
  const el = e.target;

  if (el.dataset.action === 'update-word') {
    state.form.word = el.value;
    return;
  }

  if (el.dataset.field) {
    state.form[el.dataset.field] = el.value;
    return;
  }

  if (el.dataset.action === 'search-deck') {
    state.deck.search = el.value;
    const saved = el.selectionStart;
    render();
    const next = document.querySelector('.search-input');
    if (next) {
      next.focus();
      try { next.setSelectionRange(saved, saved); } catch (_) {}
    }
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && document.activeElement?.id === 'word-input') {
    handleLookup();
    return;
  }
  if ((e.key === ' ' || e.key === 'Enter') && document.activeElement?.dataset.action === 'flip-card') {
    e.preventDefault();
    if (!state.review.flipped) { state.review.flipped = true; render(); }
  }
}

// ============================================================
// Action implementations
// ============================================================
async function handleLookup() {
  const word = state.form.word.trim();
  if (!word || state.loading) return;

  state.loading = true;
  state.error = null;
  render();

  try {
    const result = await lookupWord(word);
    state.form = {
      word,
      ipa: String(result.ipa ?? ''),
      englishEquivalent: String(result.englishEquivalent ?? ''),
      frenchDefinition: String(result.frenchDefinition ?? ''),
      exampleSentence: String(result.exampleSentence ?? ''),
      register: ['literary', 'formal', 'standard', 'spoken', 'colloquial'].includes(result.register)
        ? result.register
        : 'standard',
      notes: '',
      source: '',
      populated: true,
    };
  } catch (err) {
    state.error = err.message;
    state.form.populated = false;
  } finally {
    state.loading = false;
    render();
  }
}

function handleSaveCard() {
  const f = state.form;
  if (!f.word.trim()) return;

  const card = {
    id: crypto.randomUUID(),
    word: f.word.trim(),
    ipa: f.ipa.trim(),
    englishEquivalent: f.englishEquivalent.trim(),
    frenchDefinition: f.frenchDefinition.trim(),
    exampleSentence: f.exampleSentence.trim(),
    register: f.register,
    notes: f.notes.trim(),
    source: f.source.trim(),
    createdAt: new Date().toISOString(),
    sm2: {
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
      nextReview: today(),
    },
  };

  state.cards.push(card);
  saveCards();

  state.form = {
    word: '', ipa: '', englishEquivalent: '', frenchDefinition: '',
    exampleSentence: '', register: 'standard', notes: '', source: '', populated: false,
  };
  state.error = null;
  render();
  showToast(`“${card.word}” saved!`);
}

function handleRate(rating) {
  const { queue, index } = state.review;
  const card = queue[index];
  if (!card) return;

  applySM2(card, rating);

  const idx = state.cards.findIndex(c => c.id === card.id);
  if (idx !== -1) state.cards[idx] = card;
  saveCards();

  state.review.index += 1;
  state.review.flipped = false;
  render();
}

function handleDeleteCard(id) {
  if (!confirm('Delete this card? This cannot be undone.')) return;
  state.cards = state.cards.filter(c => c.id !== id);
  saveCards();
  state.deck.expandedId = null;
  render();
  showToast('Card deleted.');
}

function handleSaveSettings() {
  const inp = document.getElementById('api-key-input');
  if (inp) state.settings.apiKey = inp.value.trim();
  saveSettings();
  showToast('API key saved.');
}

function handleExport() {
  const blob = new Blob(
    [JSON.stringify({ cards: state.cards, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `french-vocab-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleClearData() {
  if (!confirm('Delete ALL cards and settings? This cannot be undone.')) return;
  localStorage.removeItem('fva_cards');
  localStorage.removeItem('fva_settings');
  state.cards = [];
  state.settings = { apiKey: '' };
  state.form = {
    word: '', ipa: '', englishEquivalent: '', frenchDefinition: '',
    exampleSentence: '', register: 'standard', notes: '', source: '', populated: false,
  };
  render();
  showToast('All data cleared.');
}

// ============================================================
// Bootstrap
// ============================================================
function init() {
  loadData();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('keydown', handleKeydown);

  render();
}

document.addEventListener('DOMContentLoaded', init);
