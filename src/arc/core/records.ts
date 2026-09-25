// Cloud save: the app's data as records, and the three-way merge that keeps
// devices in step. Pure functions, no network, no storage.
//
// Records: one "root" record (profile, character, onboarding, pauses, UI
// state) plus one record per session, competition, other-sport session and
// promotion. The server gives every write a revision number; a device pulls
// everything above the last revision it has seen and pushes every record that
// differs from the state it last agreed on with the server (the "base").
//
// Conflicts (the same record changed here and elsewhere since the last sync):
// - root: merged field by field, nested objects too; where both sides changed
//   the same field, this device wins.
// - other records: this device wins, except that an edit on another device
//   beats a deletion here (nothing logged gets lost by accident).

import type { ArcData, Promotion } from "./types.ts";

export type RecKind = "root" | "session" | "comp" | "cross" | "promo";

export interface Rec {
  kind: RecKind;
  id: string;
  data: unknown;
}

/** A row as the server returns it. */
export interface RemoteRow {
  kind: RecKind;
  id: string;
  data: unknown | null;
  deleted: boolean;
  rev: number;
}

/** A row to push. */
export interface PushRow {
  kind: RecKind;
  id: string;
  data?: unknown;
  deleted: boolean;
}

export interface SyncState {
  /** Highest server revision this device has applied. */
  cursor: number;
  /** Record key -> canonical JSON of the version the server has. */
  base: Record<string, string>;
}

export const emptySyncState = (): SyncState => ({ cursor: 0, base: {} });

const KINDS: RecKind[] = ["root", "session", "comp", "cross", "promo"];

/** Server ids allow letters, digits and . _ : - (1 to 80 characters). */
export const safeId = (id: string) => (id.replace(/[^A-Za-z0-9._:-]/g, "_").slice(0, 80) || "_");
export const recKey = (kind: RecKind, id: string) => `${kind}/${safeId(id)}`;
export function splitKey(key: string): { kind: RecKind; id: string } {
  const i = key.indexOf("/");
  return { kind: key.slice(0, i) as RecKind, id: key.slice(i + 1) };
}

/** Promotions have no id: date, belt and stripes identify one. */
export const promoId = (p: Promotion) => `${p.date}.${p.belt}.${p.stripes}`;

/**
 * JSON with sorted object keys. The server stores jsonb, which does not keep
 * key order, so plain JSON.stringify would see changes where there are none.
 */
export function canon(x: unknown): string {
  return JSON.stringify(sortKeys(x));
}

function sortKeys(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(sortKeys);
  if (x && typeof x === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(x as Record<string, unknown>).sort()) {
      const v = (x as Record<string, unknown>)[k];
      if (v !== undefined) out[k] = sortKeys(v);
    }
    return out;
  }
  return x;
}

/** Split the app data into records. Demo data never syncs, so the flag stays out. */
export function toRecords(d: ArcData): Map<string, Rec> {
  const m = new Map<string, Rec>();
  const { sessions, competitions, cross, promotions, demo: _demo, ...root } = d;
  m.set(recKey("root", "main"), { kind: "root", id: "main", data: root });
  for (const s of sessions) m.set(recKey("session", s.id), { kind: "session", id: safeId(s.id), data: s });
  for (const c of competitions ?? []) m.set(recKey("comp", c.id), { kind: "comp", id: safeId(c.id), data: c });
  for (const c of cross ?? []) m.set(recKey("cross", c.id), { kind: "cross", id: safeId(c.id), data: c });
  for (const p of promotions) m.set(recKey("promo", promoId(p)), { kind: "promo", id: safeId(promoId(p)), data: p });
  return m;
}

const byDate = <T extends { date: string; createdAt?: number }>(a: T, b: T) =>
  a.date === b.date ? (a.createdAt ?? 0) - (b.createdAt ?? 0) : a.date < b.date ? -1 : 1;

/** Put records back together. Missing parts fall back to an empty save. */
export function fromRecords(m: Map<string, Rec>): ArcData {
  const root = (m.get(recKey("root", "main"))?.data ?? {}) as Partial<ArcData>;
  const of = <T,>(kind: RecKind) => [...m.values()].filter((r) => r.kind === kind).map((r) => r.data as T);
  const d: ArcData = {
    v: 1,
    profile: null,
    onboarding: null,
    pauses: [],
    ui: {},
    ...root,
    sessions: of<ArcData["sessions"][number]>("session").sort(byDate),
    promotions: of<Promotion>("promo").sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
  };
  d.competitions = of<NonNullable<ArcData["competitions"]>[number]>("comp").sort(byDate);
  d.cross = of<NonNullable<ArcData["cross"]>[number]>("cross").sort(byDate);
  delete (d as Partial<ArcData>).demo;
  return d;
}

/** True when a save holds something worth keeping (a profile or logged sessions), demo data excluded. */
export function hasContent(d: ArcData | null | undefined): boolean {
  if (!d || d.demo) return false;
  return !!d.profile || d.sessions.length > 0 || (d.competitions?.length ?? 0) > 0 || (d.cross?.length ?? 0) > 0;
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const isFlatList = (x: unknown): x is (string | number)[] => Array.isArray(x) && x.every((v) => typeof v === "string" || typeof v === "number");

/**
 * Three-way merge. Objects merge field by field; lists of plain values (seen
 * items, pause weeks, known techniques) merge like sets, keeping additions and
 * removals from both sides. Where both sides changed the same value, `mine` wins.
 */
export function merge3(base: unknown, mine: unknown, theirs: unknown): unknown {
  if (canon(mine) === canon(base)) return theirs;
  if (canon(theirs) === canon(base) || canon(theirs) === canon(mine)) return mine;
  if (isFlatList(base) && isFlatList(mine) && isFlatList(theirs)) {
    const removed = new Set(base.filter((v) => !theirs.includes(v)));
    const out = mine.filter((v) => !removed.has(v));
    for (const v of theirs) if (!base.includes(v) && !out.includes(v)) out.push(v);
    return out;
  }
  if (isObj(base) && isObj(mine) && isObj(theirs)) {
    const out: Record<string, unknown> = {};
    for (const k of new Set([...Object.keys(base), ...Object.keys(mine), ...Object.keys(theirs)])) {
      const v = merge3(base[k], mine[k], theirs[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return mine;
}

/**
 * Apply pulled rows to the local data. Returns the new data, the new sync
 * state and whether anything local changed.
 */
export function applyRemote(local: ArcData, state: SyncState, rows: RemoteRow[]): { data: ArcData; state: SyncState; changed: boolean } {
  const recs = toRecords(local);
  const base = { ...state.base };
  let cursor = state.cursor;
  let changed = false;
  for (const r of [...rows].sort((a, b) => a.rev - b.rev)) {
    cursor = Math.max(cursor, r.rev);
    if (!KINDS.includes(r.kind)) continue;
    const key = recKey(r.kind, r.id);
    const mine = recs.get(key);
    const mineJson = mine ? canon(mine.data) : undefined;
    const baseJson = base[key];
    const theirsJson = r.deleted || r.data === null || r.data === undefined ? undefined : canon(r.data);
    const take = () => {
      if (theirsJson === undefined) {
        if (recs.delete(key)) changed = true;
      } else if (theirsJson !== mineJson) {
        recs.set(key, { kind: r.kind, id: r.id, data: r.data });
        changed = true;
      }
    };
    if (mineJson === baseJson) {
      // Nothing changed here since the last sync: the server version is newer.
      take();
    } else if (theirsJson === baseJson) {
      // Only this device changed it (or the row is our own last push): keep ours.
    } else if (theirsJson === mineJson) {
      // Both sides arrived at the same state.
    } else if (r.kind === "root" && mineJson !== undefined && theirsJson !== undefined) {
      const merged = merge3(baseJson === undefined ? undefined : JSON.parse(baseJson), mine!.data, r.data);
      if (canon(merged) !== mineJson) {
        recs.set(key, { kind: "root", id: "main", data: merged });
        changed = true;
      }
    } else if (mineJson === undefined && theirsJson !== undefined) {
      // Deleted here, edited elsewhere: keep the edit.
      take();
    }
    // Otherwise this device wins and pushes its version next.
    if (theirsJson === undefined) delete base[key];
    else base[key] = theirsJson;
  }
  return { data: changed ? fromRecords(recs) : local, state: { cursor, base }, changed };
}

/** Every record that differs from what the server has, and tombstones for local deletions. */
export function pendingPush(local: ArcData, state: SyncState): PushRow[] {
  const recs = toRecords(local);
  const out: PushRow[] = [];
  for (const [key, r] of recs) if (canon(r.data) !== state.base[key]) out.push({ kind: r.kind, id: r.id, data: r.data, deleted: false });
  for (const key of Object.keys(state.base)) {
    if (!recs.has(key)) {
      const { kind, id } = splitKey(key);
      out.push({ kind, id, deleted: true });
    }
  }
  // Root first, so a new device never sees sessions without a profile.
  return out.sort((a, b) => (a.kind === "root" ? -1 : b.kind === "root" ? 1 : 0));
}

/** After a successful push the pushed versions are what the server has. */
export function markPushed(state: SyncState, rows: PushRow[]): SyncState {
  const base = { ...state.base };
  for (const r of rows) {
    const key = recKey(r.kind, r.id);
    if (r.deleted) delete base[key];
    else base[key] = canon(r.data);
  }
  return { cursor: state.cursor, base };
}

/** Data from a full pull (all rows since revision 0). */
export function dataFromRows(rows: RemoteRow[]): ArcData {
  const m = new Map<string, Rec>();
  for (const r of [...rows].sort((a, b) => a.rev - b.rev)) {
    if (!KINDS.includes(r.kind)) continue;
    const key = recKey(r.kind, r.id);
    if (r.deleted || r.data === null || r.data === undefined) m.delete(key);
    else m.set(key, { kind: r.kind, id: r.id, data: r.data });
  }
  return fromRecords(m);
}

/** Sync state after a full pull: the server's versions are the base. */
export function stateFromRows(rows: RemoteRow[]): SyncState {
  const base: Record<string, string> = {};
  let cursor = 0;
  for (const r of [...rows].sort((a, b) => a.rev - b.rev)) {
    cursor = Math.max(cursor, r.rev);
    if (!KINDS.includes(r.kind)) continue;
    const key = recKey(r.kind, r.id);
    if (r.deleted || r.data === null || r.data === undefined) delete base[key];
    else base[key] = canon(r.data);
  }
  return { cursor, base };
}

export const emptySave = (): ArcData => ({ v: 1, profile: null, onboarding: null, sessions: [], pauses: [], promotions: [], ui: {} });

export type FirstSync = "remote" | "adopt" | "ask" | "empty";

/**
 * First sign-in of an account on this device. `device` is what the device
 * had before (guest data), `remote` the account's data.
 * - remote: the account has data, the device nothing worth keeping
 * - adopt: the account is empty, the device has data: it moves into the account
 * - ask: both have data, the player decides
 * - empty: neither has anything yet
 */
export function firstSync(device: ArcData | null, remote: ArcData): FirstSync {
  const d = hasContent(device);
  const r = hasContent(remote);
  if (d && r) return "ask";
  if (d) return "adopt";
  if (r) return "remote";
  return "empty";
}

export type Combine = "merge" | "account" | "device";

/**
 * Resolve "ask": merge (trainings from both, the account's profile), keep the
 * account's data, or keep the device's data (which then replaces the account's).
 */
export function combine(device: ArcData, remote: ArcData, how: Combine): ArcData {
  if (how === "account") return remote;
  if (how === "device") return { ...device, demo: undefined };
  const recs = toRecords(remote);
  for (const [key, r] of toRecords(device)) {
    if (r.kind === "root") {
      if (!remote.profile) recs.set(key, r);
      continue;
    }
    if (!recs.has(key)) recs.set(key, r);
  }
  return fromRecords(recs);
}

/** Short description of a save for the choice dialog. */
export function summary(d: ArcData): { name: string | null; sessions: number; last: string | null } {
  const dates = [...d.sessions.map((s) => s.date), ...(d.competitions ?? []).map((c) => c.date), ...(d.cross ?? []).map((c) => c.date)].sort();
  return { name: d.profile?.name ?? null, sessions: d.sessions.length, last: dates.length ? dates[dates.length - 1] : null };
}
