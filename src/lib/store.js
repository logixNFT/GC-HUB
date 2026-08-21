import { SEED, normalize } from "../data/seed.js";

/* ============================================================
   Data resolution order, on load:
     1. local working draft (this browser)   → source "draft"
     2. published /gc-hub-data.json          → source "published"
     3. built-in demo SEED                   → source "seed"

   Edits autosave to the draft so a refresh never loses work.
   "Revert to published" drops the draft and reloads (2) or (3).
   ============================================================ */

const KEY = "gc-hub:draft:v1";
export const DATA_URL = "/gc-hub-data.json";

export function loadDraft() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? normalize(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

export function saveDraft(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; // private mode or quota — the app keeps working in memory
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/* The published data file. Absent is the normal case for a fresh repo. */
export async function fetchPublished() {
  try {
    const r = await fetch(DATA_URL, { cache: "no-store" });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    // A SPA rewrite can answer a missing file with index.html — don't parse HTML as data.
    if (!ct.includes("json")) return null;
    return normalize(await r.json());
  } catch {
    return null;
  }
}

export async function resolveInitial() {
  const draft = loadDraft();
  if (draft) return { data: draft, source: "draft" };

  const published = await fetchPublished();
  if (published) return { data: published, source: "published" };

  return { data: normalize(SEED), source: "seed" };
}
