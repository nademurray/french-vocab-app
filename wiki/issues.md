# Issues

## RESOLVED — Wrong Claude model ID

**Date**: 2026-05-03  
**Symptom**: "Look it up" returned error: `model: claude-sonnet-4-20250514`  
**Root cause**: Project brief specified model ID `claude-sonnet-4-20250514` which is invalid. Correct ID is `claude-sonnet-4-6`.  
**Fix**: Updated `app.js` line with `model:` field. Committed and pushed.  
**File**: `app.js` → `lookupWord()` → `body: JSON.stringify({ model: 'claude-sonnet-4-6', ... })`

---

## RESOLVED — Service worker served stale app.js after fix

**Date**: 2026-05-03  
**Symptom**: After pushing the model ID fix, phone still showed the old error. Multiple browser refreshes had no effect.  
**Root cause**: Cache-first service worker was serving the cached `app.js` (with old model ID) instead of fetching the updated file from the network.  
**Fix**: Bumped cache name in `sw.js` from `fva-v1` to `fva-v2`. Also instructed user to manually clear Chrome cache on phone (Settings → Privacy → Clear cached images and files).  
**Lesson**: Any time app.js, style.css, or other cached files are updated, bump the cache version in `sw.js`. This is the reliable way to force all clients to fetch fresh files.  
**File**: `sw.js` → `const CACHE = 'fva-v2';`
