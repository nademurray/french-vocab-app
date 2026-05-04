# Project

## What it is

A personal French vocabulary PWA. The user reads French novels and watches French media daily, and needs a frictionless way to capture and review unfamiliar words on their phone.

## User context

- **GitHub**: nademurray
- **Device**: Pixel 9 Pro XL (Android), Chrome
- **French level**: B1+/B2 — strong reading comprehension, gaps in grammar and spoken/casual register
- **Goal**: September 2026 trip to Toulouse and Montpellier
- **Daily practice**: 30–45 min French novels, French media listening
- **Target vocabulary**: literary/contemporary fiction register (e.g. *se morfondre*, *se faufiler*, *s'épancher*)

## Why this app exists

Evaluated alternatives and rejected them:
- **Quizlet**: poor mobile UX for quick capture
- **Brainscape**: paywall after 8 cards
- **Anki**: clunky for rapid one-handed capture on phone

Core requirement: near-zero-friction mobile word capture + spaced repetition review.

## Constraints

- Personal/private app — Claude API key can be embedded (stored in localStorage)
- V1 uses localStorage only; designed to migrate to Supabase in V2
- Deployed on GitHub Pages (static, no backend)
- No build step — vanilla JS, files served as-is
