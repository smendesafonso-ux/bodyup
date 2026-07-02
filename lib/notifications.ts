"use client";

// Notifications locales : demande de permission + rappels programmés (via le service worker).
// Chaque type de rappel est activable individuellement dans Profil → Notifications.
// NB : la livraison quand l'app est totalement fermée nécessite du push serveur (VAPID) —
// prévu en évolution. Ici : rappels fiables quand la PWA est ouverte ou en arrière-plan.

export function notifSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}
export function notifPermission(): NotificationPermission {
  return notifSupported() ? Notification.permission : "denied";
}
export async function requestNotif(): Promise<NotificationPermission> {
  if (!notifSupported()) return "denied";
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

export async function showNotif(title: string, body: string, tag = "bodyup"): Promise<void> {
  if (notifPermission() !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { reg.active?.postMessage({ type: "notify", title, body, tag }); return; }
  } catch { /* fallback ci-dessous */ }
  try { new Notification(title, { body, icon: "/bodyup/icon-192.png", tag }); } catch { /* ignore */ }
}

/* ---------- Préférences par type de rappel ---------- */
export type NotifCat = "eau" | "repas" | "bilan" | "vide" | "messages";
export const NOTIF_CATS: { cat: NotifCat; label: string; desc: string }[] = [
  { cat: "eau", label: "Hydratation", desc: "2 rappels d'eau par jour (9h, 16h)" },
  { cat: "repas", label: "Repas", desc: "Penser à noter déjeuner (12h30) et dîner (19h30)" },
  { cat: "bilan", label: "Bilan du soir", desc: "Ton score du jour à 21h" },
  { cat: "vide", label: "Journée vide", desc: "Alerte à 20h si aucun repas enregistré" },
  { cat: "messages", label: "Messages", desc: "Quand un proche t'écrit" },
];

const PREF_KEY = "bodyup_notif_prefs";

export function notifPrefs(): Record<NotifCat, boolean> {
  const def: Record<NotifCat, boolean> = { eau: true, repas: true, bilan: true, vide: true, messages: true };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? { ...def, ...JSON.parse(raw) } : def;
  } catch {
    return def;
  }
}
export function setNotifPref(cat: NotifCat, v: boolean): void {
  try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...notifPrefs(), [cat]: v })); } catch { /* ignore */ }
}

/** Interrupteur général (rétro-compatible avec l'ancien réglage unique). */
export function remindersEnabled(): boolean {
  return typeof localStorage !== "undefined" && localStorage.getItem("bodyup_notif") === "1";
}
export function setRemindersEnabled(v: boolean): void {
  try { localStorage.setItem("bodyup_notif", v ? "1" : "0"); } catch { /* ignore */ }
}

const SLOTS: { h: number; m: number; tag: string; cat: NotifCat; title: string; body: string }[] = [
  { h: 9, m: 0, tag: "eau-am", cat: "eau", title: "Hydratation 💧", body: "Un verre d'eau pour bien démarrer la journée." },
  { h: 12, m: 30, tag: "midi", cat: "repas", title: "Déjeuner 🍽️", body: "Pense à noter ton repas dans le journal." },
  { h: 16, m: 0, tag: "eau-pm", cat: "eau", title: "Hydratation 💧", body: "Encore un verre d'eau ?" },
  { h: 19, m: 30, tag: "soir", cat: "repas", title: "Dîner 🍽️", body: "Note ton dîner et vérifie tes calories restantes." },
  { h: 21, m: 0, tag: "bilan", cat: "bilan", title: "Bilan du jour 📊", body: "Regarde ton score et ta progression." },
];

/**
 * Boucle légère : vérifie chaque minute et déclenche chaque créneau une fois par jour.
 * `hasEntriesToday` permet le rappel « journée vide » de 20h (si fourni).
 */
export function startReminderLoop(hasEntriesToday?: () => boolean): number {
  const tick = () => {
    if (!remindersEnabled() || notifPermission() !== "granted") return;
    const prefs = notifPrefs();
    const now = new Date();
    const key = `bodyup_fired_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    let fired: string[] = [];
    try { fired = JSON.parse(localStorage.getItem(key) || "[]"); } catch { fired = []; }
    const fire = (tag: string, title: string, body: string) => {
      showNotif(title, body, tag);
      fired.push(tag);
      try { localStorage.setItem(key, JSON.stringify(fired)); } catch { /* ignore */ }
    };
    for (const sl of SLOTS) {
      if (prefs[sl.cat] && now.getHours() === sl.h && now.getMinutes() === sl.m && !fired.includes(sl.tag)) {
        fire(sl.tag, sl.title, sl.body);
      }
    }
    // Journée vide : à 20h, si rien n'a été enregistré aujourd'hui.
    if (prefs.vide && hasEntriesToday && now.getHours() === 20 && now.getMinutes() === 0 && !fired.includes("vide") && !hasEntriesToday()) {
      fire("vide", "Ta journée est vide 📝", "Aucun repas enregistré aujourd'hui — 2 minutes suffisent pour garder ta série.");
    }
  };
  tick();
  return window.setInterval(tick, 60000);
}

/** Notification à la réception d'un message d'un proche (si activée). */
export function notifyMessage(fromName: string, body: string): void {
  if (!remindersEnabled() || !notifPrefs().messages) return;
  showNotif(`Message de @${fromName} 💬`, body.length > 90 ? body.slice(0, 90) + "…" : body, "msg");
}
