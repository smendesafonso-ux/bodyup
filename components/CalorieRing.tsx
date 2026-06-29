"use client";

import { useEffect, useRef, useState } from "react";
import { fr } from "@/lib/nutrition";

interface Props {
  /** valeur affichée au centre (compteur animé) */
  value: number;
  /** fraction de l'anneau remplie (0–1) */
  fraction: number;
  size?: number;
  stroke?: number;
  label?: string;
  big?: number;
  color?: string;
  /** relance l'animation quand cette clé change (ex: changement d'onglet) */
  trigger?: unknown;
}

export function CalorieRing({
  value, fraction, size = 148, stroke = 13,
  label = "kcal restantes", big = 38, color = "var(--lime)", trigger,
}: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    setOffset(circ);
    setDisplay(0);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOffset(circ * (1 - Math.min(fraction, 1))))
    );
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min((now - t0) / 1400, 1);
      const e = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(value * e));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, fraction, circ, trigger]);

  const c = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: big, lineHeight: 1, letterSpacing: "-.02em" }}>{fr(display)}</span>
        <span style={{ fontSize: 11, color: "var(--txt-2)", textTransform: "uppercase", letterSpacing: ".12em", marginTop: 5 }}>{label}</span>
      </div>
    </div>
  );
}
