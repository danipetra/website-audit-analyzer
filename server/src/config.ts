export const FETCH_TIMEOUT_MS = 8000;
export const MAX_INTERNAL_PAGES = 4;
// Per page, in DOM order (same "first = more important" reasoning as
// MAX_INTERNAL_PAGES) — keeps the asset check bounded and light instead of
// fanning out to every image/video/document a real page can reference.
export const MAX_ASSETS_PER_PAGE = 10;
export const USER_AGENT =
  "Mozilla/5.0 (compatible; BlissAuditBot/1.0; +https://bliss-agency.example)";
