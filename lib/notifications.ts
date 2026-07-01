"use client";

// Notifications locales : demande de permission + rappels programmés (via le service worker).
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

export function remindersEnabled(): boolean {
  return typeof localStorage !== "undefined" && localStorage.getItem("bodyup_notif") === "1";
}
export function setRemindersEnabled(v: boolean): void {
  try { localStorage.setItem("bodyup_notif", v ? "1" : "0"); } catch { /* ignore */ }
}

const SLOTS = [
  { h: 9, m: 0, tag: "eau-am", title: "Hydratation 💧", body: "Un verre d'eau pour bien démarrer la journée." },
  { h: 12, m: 30, tag: "midi", title: "Déjeuner 🍽️", body: "Pense à noter ton repas dans le journal." },
  { h: 16, m: 0, tag: "eau-pm", title: "Hydratation 💧", body: "Encore un verre d'eau ?" },
  { h: 19, m: 30, tag: "soir", title: "Dîner 🍽️", body: "Note ton dîner et vérifie tes calories restantes." },
  { h: 21, m: 0, tag: "bilan", title: "Bilan du jour 📊", body: "Regarde ton score et ta progression." },
];

/** Boucle légère : vérifie chaque minute et déclenche chaque créneau une fois par jour. */
export function startReminderLoop(): number {
  const tick = () => {
    if (!remindersEnabled() || notifPermission() !== "granted") return;
    const now = new Date();
    const key = `bodyup_fired_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    let fired: string[] = [];
    try { fired = JSON.parse(localStorage.getItem(key) || "[]"); } catch { fired = []; }
    for (const s of SLOTS) {
      if (now.getHours() === s.h && now.getMinutes() === s.m && !fired.includes(s.tag)) {
        showNotif(s.title, s.body, s.tag);
        fired.push(s.tag);
        try { localStorage.setItem(key, JSON.stringify(fired)); } catch { /* ignore */ }
      }
    }
  };
  tick();
  return window.setInterval(tick, 60000);
}
