# Session Log

## 2026-05-03 — Initial build and deployment

**Summary**: Full app built from scratch, deployed to GitHub Pages, tested on Pixel 9 Pro XL.

**What was done**:
- Read project brief (`French-Vocabulary-App-Brief.md`) in the workspace folder
- Clarified 3 decisions with user: vanilla JS (chosen), Settings screen for API key (chosen), GitHub Pages (chosen)
- Built all 6 app files: `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.json`, `icons/`
- Configured git identity (`nade.bouvia@gmail.com` / `nademurray`), init'd repo, pushed to `github.com/nademurray/french-vocab-app`
- User enabled GitHub Pages → app live at `https://nademurray.github.io/french-vocab-app/`
- User installed as PWA on Pixel 9 Pro XL via Chrome "Add to Home Screen"
- User purchased $5 Anthropic API credits (billed separately from Claude.ai Pro subscription)
- User created API key `nade-onboarding-api-key` in Anthropic Console, saved to app Settings
- Fixed model ID bug (see issues.md)
- Fixed service worker caching bug (see issues.md)
- Added `.gitignore` to exclude `French-Vocabulary-App-Brief.md` and `.claude/` from repo
- User successfully saved first card ("filer")
- Created this wiki

**State at end of session**: App fully functional on user's phone. 1 card in deck.
