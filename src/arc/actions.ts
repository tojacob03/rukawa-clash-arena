import type { ArcData, Attire, Belt, Character, Competition, CrossSession, FlagDesign, Look, MatCount, Profile, QuestKind, Session, Slot } from "./core/types.ts";
import type { TrainingPlan } from "./core/schedule.ts";
import { getCharacter } from "./character.ts";
import { ITEMS } from "./core/items.ts";
import { TECH } from "./core/techniques.ts";
import { buildDemo } from "./core/demo.ts";
import { dayNum, weekOf } from "./core/model.ts";
import { arcStore, emptyData, isArcData } from "./store.ts";

export function acceptQuest(today: string, q: { node: string; kind: QuestKind; xp: number }) {
  arcStore.set((d) => ({ ...d, ui: { ...d.ui, accepted: { day: today, node: q.node, kind: q.kind, xp: q.xp } } }));
}

export function markReroll(today: string) {
  arcStore.set((d) => ({ ...d, ui: { ...d.ui, rerollDay: today } }));
}

export function setTodayAttire(today: string, attire: Attire) {
  arcStore.set((d) => {
    const acc = d.ui.accepted;
    const dropAccepted = acc && acc.day === today && attire === "nogi" && !TECH[acc.node]?.nogi;
    return { ...d, ui: { ...d.ui, todayAttire: { day: today, attire }, accepted: dropAccepted ? undefined : acc } };
  });
}

export function saveSession(s: Session) {
  // The mat counter for this day ends up in the session; clear it.
  arcStore.set((d) => ({ ...d, sessions: [...d.sessions, s], ui: d.ui.mat?.day === s.date ? { ...d.ui, mat: undefined } : d.ui }));
}

export function setPlan(plan: TrainingPlan) {
  arcStore.set((d) => ({ ...d, plan }));
}

/** Start or continue counting a quest on the mat. Also accepts the quest for the day. */
export function matStart(today: string, q: { node: string; kind: QuestKind; xp: number }) {
  arcStore.set((d) => {
    const cur = d.ui.mat;
    const same = cur && cur.day === today && cur.node === q.node;
    const mat: MatCount = same ? cur : { day: today, node: q.node, kind: q.kind, xp: q.xp, att: 0, succ: 0, done: false };
    return { ...d, ui: { ...d.ui, accepted: { day: today, node: q.node, kind: q.kind, xp: q.xp }, mat } };
  });
}

export function matSet(patch: Partial<Pick<MatCount, "att" | "succ" | "done">>) {
  arcStore.set((d) => (d.ui.mat ? { ...d, ui: { ...d.ui, mat: { ...d.ui.mat, ...patch } } } : d));
}

export function saveCompetition(c: Competition) {
  arcStore.set((d) => ({ ...d, competitions: [...(d.competitions ?? []).filter((x) => x.id !== c.id), c] }));
}

export function saveCross(c: CrossSession) {
  arcStore.set((d) => ({ ...d, cross: [...(d.cross ?? []).filter((x) => x.id !== c.id), c] }));
}

export function deleteCross(id: string) {
  arcStore.set((d) => ({ ...d, cross: (d.cross ?? []).filter((x) => x.id !== id) }));
}

/** Remember a weight class typed in by hand, so it shows up as a chip next time. */
export function rememberWeightClass(w: string) {
  arcStore.set((d) => {
    if (!d.profile) return d;
    const list = d.profile.weightClasses ?? [];
    return list.includes(w) ? d : { ...d, profile: { ...d.profile, weightClasses: [...list, w].slice(-8) } };
  });
}

export function deleteCompetition(id: string) {
  arcStore.set((d) => ({ ...d, competitions: (d.competitions ?? []).filter((x) => x.id !== id) }));
}

export function deleteSession(id: string) {
  arcStore.set((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
}

export function createProfile(
  p: Omit<Profile, "startBelt" | "startStripes" | "createdAt">,
  today: string,
  known: string[],
  claims: Record<string, number>,
  look: Look,
  mode: Attire = "gi",
) {
  arcStore.set({
    ...emptyData(),
    profile: { ...p, startBelt: p.belt, startStripes: p.stripes, createdAt: today },
    onboarding: { date: today, known, claims },
    // Start gear and flags are not "new"; only what you find later is.
    character: { ...getCharacter(emptyData()), look, mode, seen: [...ITEMS.filter((x) => x.src.t === "start").map((x) => x.id), ...(p.countries ?? []).map((c) => `flag:${c}`)] },
  });
}

export function updateProfile(patch: Partial<Omit<Profile, "startBelt" | "startStripes" | "createdAt">>) {
  arcStore.set((d) => (d.profile ? { ...d, profile: { ...d.profile, ...patch } } : d));
}

export function promote(today: string, belt: Belt, stripes: number) {
  arcStore.set((d) =>
    d.profile ? { ...d, profile: { ...d.profile, belt, stripes }, promotions: [...d.promotions, { date: today, belt, stripes }] } : d,
  );
}

export function togglePause(today: string) {
  const w = weekOf(dayNum(today));
  arcStore.set((d) => ({ ...d, pauses: d.pauses.includes(w) ? d.pauses.filter((x) => x !== w) : [...d.pauses, w] }));
}

export function loadDemo(today: string) {
  arcStore.set(buildDemo(today));
}

export function resetAll() {
  arcStore.clear();
}

export function exportJson(d: ArcData) {
  const blob = new Blob([JSON.stringify({ ...d, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waza-arc-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importJson(file: File): Promise<string | null> {
  try {
    const parsed = JSON.parse(await file.text());
    if (!isArcData(parsed)) return "Die Datei ist kein Waza-Arc-Export.";
    const { exportedAt: _drop, ...rest } = parsed as ArcData & { exportedAt?: string };
    arcStore.set({ ...emptyData(), ...rest, demo: false });
    return null;
  } catch {
    return "Die Datei konnte nicht gelesen werden.";
  }
}

function setCharacter(fn: (c: Character) => Character) {
  arcStore.set((d) => ({ ...d, character: fn(getCharacter(d)) }));
}

export const setLook = (look: Look) => setCharacter((c) => ({ ...c, look }));
export const setMode = (mode: Attire) => setCharacter((c) => ({ ...c, mode }));
export const setFlag = (flag: FlagDesign) => setCharacter((c) => ({ ...c, flag }));
export const setShipName = (shipName: string) => setCharacter((c) => ({ ...c, shipName: shipName.trim().slice(0, 28) || undefined }));
export const equip = (slot: Slot, id: string | null) =>
  setCharacter((c) => {
    // "" means: deliberately empty, do not fall back to the default item.
    return { ...c, equipped: { ...c.equipped, [slot]: id ?? "" } };
  });
export const markSeen = (ids: string[]) => setCharacter((c) => ({ ...c, seen: [...new Set([...c.seen, ...ids])] }));
