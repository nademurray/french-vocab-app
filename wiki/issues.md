# Issues

## RESOLVED — Wrong Claude model ID

**Date**: 2026-05-03  
**Symptom**: "Look it up" returned error: `model: claude-sonnet-4-20250514`  
**Root cause**: Project brief specified model ID `claude-sonnet-4-20250514` which is invalid. Correct ID is `claude-sonnet-4-6`.  
**Fix**: Updated `app.js` line with `model:` field. Committed and pushed.  
**File**: `app.js` → `lookupWord()` → `body: JSON.stringify({ model: 'claude-sonnet-4-6', ... })`

---

## RESOLVED — Rating buttons unclickable on long flashcard backs

**Date**: 2026-05-04  
**Symptom**: After flipping a card with a long French definition + example sentence, the 1–5 rating buttons were visible but unresponsive to taps. The user could not advance through the review session.  
**Root cause**: `.flashcard-front` and `.flashcard-back` are `position: absolute; inset: 0` inside `.flashcard-inner` (which has a fixed `min-height: 280px`). When the back content exceeds 280px it overflows downward — visually covering the `.rating-row` that follows in the DOM. Taps on the rating buttons actually landed on the overflowing card content (which is part of the `.flashcard` element with `data-action="flip-card"`), so they were swallowed as no-op flip attempts.  
**Fix**: In `handleClick` for `flip-card`, after `render()` measure `back.scrollHeight` and set it on `.flashcard-inner.style.minHeight`. The container then grows to hold all back content, pushing the rating row below it and making it fully tappable.  
**File**: `app.js` → `handleClick` → `case 'flip-card'`  
**SW bump**: `fva-v2` → `fva-v3` in `sw.js` to force cache refresh.

---

## RESOLVED — Service worker served stale app.js after fix

**Date**: 2026-05-03  
**Symptom**: After pushing the model ID fix, phone still showed the old error. Multiple browser refreshes had no effect.  
**Root cause**: Cache-first service worker was serving the cached `app.js` (with old model ID) instead of fetching the updated file from the network.  
**Fix**: Bumped cache name in `sw.js` from `fva-v1` to `fva-v2`. Also instructed user to manually clear Chrome cache on phone (Settings → Privacy → Clear cached images and files).  
**Lesson**: Any time app.js, style.css, or other cached files are updated, bump the cache version in `sw.js`. This is the reliable way to force all clients to fetch fresh files.  
**File**: `sw.js` → `const CACHE = 'fva-v2';`
