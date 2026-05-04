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

**State at end of session**: App fully functional on user's phone. 1 card in deck.

---

## 2026-05-04 — Fix rating buttons blocked by long card content

**Summary**: Debugged and fixed a bug where the 1–5 rating buttons were unclickable when a flashcard's back content was long.

**What was done**:
- Diagnosed overflow issue: back face (`position: absolute; inset: 0`) overflowed its 280px container and covered the rating buttons
- Fixed in `app.js`: after flip, measure `back.scrollHeight` and set it on `.flashcard-inner.style.minHeight`
- Bumped SW cache `fva-v2` → `fva-v3` in `sw.js` to force phone to receive updated `app.js`
- Updated `wiki/issues.md` with root cause and fix

**State at end of session**: Bug fixed, committed, pushed, and confirmed working on device. Rating buttons always accessible regardless of card content length.

---

## 2026-05-04 — Wiki creation and session close

**Summary**: Created LLM wiki for persistent cross-session context.

**What was done**:
- Created `wiki/` folder with 5 pages: `index.md`, `project.md`, `architecture.md`, `sessions.md`, `issues.md`, `backlog.md`
- Wiki follows Karpathy's LLM Wiki pattern (gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- Committed and pushed wiki to repo

**State at end of session**: App live and working. Wiki in place. User starting new chat sessions from here.
