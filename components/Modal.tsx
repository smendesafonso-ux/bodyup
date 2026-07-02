"use client";

import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import s from "@/styles/mobile.module.css";

/**
 * Fenêtre modale UNIQUE de l'app.
 * Montée sur <body> via un portail React, en position fixe sur le viewport :
 * elle ne dépend plus d'aucun ancêtre (page défilante, transform, clavier iOS),
 * ce qui élimine définitivement les fenêtres qui s'ouvrent « en bas de page ».
 *
 * - center : centrée verticalement (fenêtres de saisie, reste visible au-dessus du clavier)
 * - tall   : feuille pleine hauteur (fiches recette / exercice)
 */
export function Modal({ center, tall, onClose, sheetStyle, children }: {
  center?: boolean;
  tall?: boolean;
  onClose: () => void;
  sheetStyle?: CSSProperties;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Verrouille le défilement de l'arrière-plan tant que la fenêtre est ouverte.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fermeture au clavier (Échap) — utile sur desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(
    <div className={`${s.modalwrap} ${center ? s.centerwrap : ""}`} onClick={onClose}>
      <div className={`${s.sheet} ${tall ? s.rsheet : ""}`} style={sheetStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body
  );
}
