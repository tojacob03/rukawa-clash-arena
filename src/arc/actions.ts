import type { ArcData, Attire, Belt, Profile, QuestKind, Session } from "./core/types.ts";
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
  arcStore.set((d) => ({ ...d, sessions: [...d.sessions, s] }));
}

export function deleteSession(id: string) {
  arcStore.set((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
}

export function createProfile(p: Omit<Profile, "startBelt" | "createdAt">, today: string, known: string[]) {
  arcStore.set({
    ...emptyData(),
    profile: { ...p, startBelt: p.belt, createdAt: today },
    onboarding: { date: today, known },
  });
}

export function updateProfile(patch: Partial<Pick<Profile, "name" | "weeklyGoal">>) {
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
