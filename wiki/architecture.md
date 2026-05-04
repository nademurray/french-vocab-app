# Architecture

## Stack

- **Frontend**: Vanilla JS (no framework, no build step)
- **Storage**: `localStorage` — keys: `fva_cards`, `fva_settings`
- **Hosting**: GitHub Pages → `https://nademurray.github.io/french-vocab-app/`
- **AI**: Claude API, model `claude-sonnet-4-6`, called directly from the browser
- **Offline**: Service worker (`sw.js`), cache-first strategy, cache name versioned (`fva-v2`)

## File structure

```
french-vocab-app/
├── index.html          ← single-page app shell
├── style.css           ← mobile-first, dark mode, French blue (#0055A4) accent
├── app.js              ← all logic: state, rendering, SM-2, Claude API, events
├── sw.js               ← service worker (offline cache of app shell)
├── manifest.json       ← PWA manifest (start_url: ./index.html)
├── icons/
│   ├── icon.svg
│   └── icon-maskable.svg
├── .gitignore
└── wiki/               ← this knowledge base (not part of deployed app)
```

## App structure (app.js)

Single `state` object. `render()` rebuilds `#app` innerHTML on every state change. Events handled via a single delegated `click` listener using `data-action` attributes on elements.

Four screens toggled by `state.screen`:
- **capture** (default): word input → Claude API → editable card form → save
- **review**: SM-2 queue, flashcard flip, 1–5 confidence rating
- **deck**: sorted/searchable card list with expandable details
- **settings**: API key (localStorage), export JSON, clear all data

## Data model

```json
{
  "id": "uuid",
  "word": "se morfondre",
  "ipa": "/sə mɔʁfɔ̃dʁ/",
  "englishEquivalent": "to mope, to languish",
  "frenchDefinition": "Se consumer d'ennui...",
  "exampleSentence": "Elle se morfondait...",
  "register": "literary",
  "notes": "",
  "source": "",
  "createdAt": "ISO timestamp",
  "sm2": {
    "repetitions": 0,
    "easeFactor": 2.5,
    "interval": 1,
    "nextReview": "YYYY-MM-DD"
  }
}
```

## SM-2 algorithm

User rates 1–5, mapped to SM-2 quality 0–5 via `[0,1,3,4,5]`. Standard SM-2 rules: quality < 3 resets repetitions and interval to 1; quality ≥ 3 advances interval (1 → 6 → interval × easeFactor). easeFactor floored at 1.3.

## Claude API call

- Endpoint: `https://api.anthropic.com/v1/messages`
- Required header: `anthropic-dangerous-direct-browser-access: true`
- API key sourced from `localStorage` (`fva_settings.apiKey`), entered by user in Settings
- Prompt asks for JSON with keys: `ipa`, `englishEquivalent`, `frenchDefinition`, `exampleSentence`, `register`
- Response stripped of markdown code fences before JSON.parse

## Key design decisions

| Decision | Rationale |
|---|---|
| Vanilla JS over React/Svelte | No build step, deploy by pushing files, simpler for a personal app |
| localStorage over IndexedDB | Sufficient for V1, simpler API |
| API key in localStorage | Personal app, user enters once; never hardcoded in source |
| SVG icons (not PNG) | Avoids needing an image generation tool; modern Android Chrome supports SVG PWA icons |
| Cache-first SW | Offline-first; cache name bumped to force updates when needed |
