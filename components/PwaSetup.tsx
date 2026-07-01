"use client";

import { useEffect } from "react";

/** Enregistre le service worker (rend l'app installable + gère les notifications). */
export function PwaSetup() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/bodyup/sw.js", { scope: "/bodyup/" }).catch(() => { /* dev : 404 sans basePath, ignoré */ });
  }, []);
  return null;
}
