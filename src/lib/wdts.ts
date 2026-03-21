/* ═══════════════════════════════════════════════════════
   SRT PARSER
═══════════════════════════════════════════════════════ */

export interface SubEntry {
  start: number;
  end: number;
  text: string;
}

export function parseSRT(raw: string): SubEntry[] {
  const clean = (s: string) =>
    s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();

  return raw
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.trim().split("\n");
      if (lines.length < 3) return null;
      const m = lines[1].match(
        /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
      );
      if (!m) return null;
      const toMs = (t: string): number => {
        const [hms, ms] = t.replace(",", ".").split(".");
        const [h, min, s] = hms.split(":").map(Number);
        return (h * 3600 + min * 60 + s) * 1000 + Number(ms);
      };
      return {
        start: toMs(m[1]),
        end: toMs(m[2]),
        text: clean(lines.slice(2).join(" ")),
      };
    })
    .filter((x): x is SubEntry => x !== null);
}

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */

export interface HistoryEntry {
  id: string;
  name: string;
  lastPosition: number;
  duration: number;
  updatedAt: number;
  engSubName?: string;
  arSubName?: string;
}

export interface WordEntry {
  word: string;
  context: string;
  at: number;
}

export interface SubtitlePair {
  en: string;
  ar: string;
}

/* ═══════════════════════════════════════════════════════
   FILE SYSTEM ACCESS API
═══════════════════════════════════════════════════════ */

export const FS_SUPPORTED =
  typeof window !== "undefined" && "showOpenFilePicker" in window;

export async function pickFileWithHandle(
  opts: any
): Promise<{ handle: FileSystemFileHandle; file: File } | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker(opts);
    const file = await handle.getFile();
    return { handle, file };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") return null;
    throw e;
  }
}

export function pickFileFallback(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = accept;
    inp.onchange = () => resolve(inp.files?.[0] ?? null);
    inp.oncancel = () => resolve(null);
    inp.click();
  });
}

/* ═══════════════════════════════════════════════════════
   INDEXEDDB
═══════════════════════════════════════════════════════ */

const DB_NAME = "wdts_db";
const DB_VERSION = 1;
const STORE = "file_handles";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHandle(key: string, handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadHandle(key: string): Promise<FileSystemFileHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteHandle(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function reopenHandle(name: string): Promise<File | null> {
  try {
    const handle = await loadHandle(name);
    if (!handle) return null;
    const perm = await (handle as any).requestPermission({ mode: "read" });
    if (perm !== "granted") return null;
    return await handle.getFile();
  } catch {
    return null;
  }
}

/** Build the IndexedDB key used to store an SRT file handle. */
export function srtHandleKey(audioId: string, lang: "en" | "ar"): string {
  return `srt_${lang}_${audioId}`;
}

/** Try to reopen a stored SRT handle and parse it. Returns parsed SubEntry[] or null. */
export async function reopenSrtHandle(audioId: string, lang: "en" | "ar"): Promise<{ entries: SubEntry[]; fileName: string } | null> {
  try {
    const key = srtHandleKey(audioId, lang);
    const handle = await loadHandle(key);
    if (!handle) return null;
    const perm = await (handle as any).requestPermission({ mode: "read" });
    if (perm !== "granted") return null;
    const file = await handle.getFile();
    const raw = await file.text();
    return { entries: parseSRT(raw), fileName: file.name };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   LOCALSTORAGE
═══════════════════════════════════════════════════════ */

const H_KEY = "wdts_history";
const W_KEY = "wdts_words";

export const getHistory = (): HistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(H_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const upsertHistory = (entry: HistoryEntry): void => {
  const list = getHistory();
  const idx = list.findIndex((x) => x.id === entry.id);
  const updated = { ...entry, updatedAt: Date.now() };
  if (idx >= 0) list[idx] = updated;
  else list.unshift(updated);
  localStorage.setItem(H_KEY, JSON.stringify(list.slice(0, 50)));
};

export const removeHistory = (id: string): void => {
  localStorage.setItem(
    H_KEY,
    JSON.stringify(getHistory().filter((x) => x.id !== id))
  );
  deleteHandle(id).catch(() => {});
};

export const getWords = (): WordEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(W_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const addWord = (word: string, ctx: string): boolean => {
  const ws = getWords();
  if (ws.some((w) => w.word.toLowerCase() === word.toLowerCase())) return false;
  ws.unshift({ word, context: ctx, at: Date.now() });
  localStorage.setItem(W_KEY, JSON.stringify(ws));
  return true;
};

export const removeWord = (word: string): void => {
  localStorage.setItem(
    W_KEY,
    JSON.stringify(getWords().filter((w) => w.word !== word))
  );
};

/* ═══════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════ */

export const fmt = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtDate = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
