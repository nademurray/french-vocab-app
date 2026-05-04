# Backlog

## Planned

- `[V2]` **Cloud sync via Supabase** — localStorage is device-local; cards saved on phone are not accessible on laptop. V1 was explicitly scoped to localStorage. V2 should migrate storage to Supabase with user auth.
- `[V2]` **Import JSON** — complement to the existing Export. Let user restore a backup or migrate cards from another device.

## Ideas (not committed)

- `[idea]` **Progress stats screen** — cards added over time, review streaks, due-today count. Brief listed this as "nice-to-have".
- `[idea]` **Source tagging / filtering** — filter deck by source (e.g. show only words from a specific book).
- `[idea]` **Edit existing cards** — currently cards can only be deleted and re-added. An edit flow in the Deck screen would be useful.
- `[idea]` **Bulk review session limit** — cap daily review at N cards to avoid long sessions when many are due at once.
- `[idea]` **Audio pronunciation** — use a TTS API to play IPA audio on the review card front.

## Known limitations

- **localStorage only**: No cross-device sync. Cards are siloed to the browser they were created in. Export JSON is the only backup mechanism — user should do this periodically.
- **Service worker update UX**: When app files change, users must clear Chrome cache manually or wait for the SW to pick up the new cache version. Consider adding an in-app "update available" banner in a future session.
- **No duplicate detection**: Saving the same word twice creates two separate cards silently.
- **SVG icons**: Android Chrome supports SVG PWA icons but some older launchers may not. Not a current concern for Pixel 9 Pro XL / Chrome.
