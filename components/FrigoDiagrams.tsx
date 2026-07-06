"use client";

import f from "@/styles/frigo.module.css";
import type { DiagramId } from "@/lib/frigo-data";

export function Diagram({ id }: { id: DiagramId }) {
  if (id === "cycle") return <CycleDiagram />;
  if (id === "bottle80") return <BottleGauge />;
  if (id === "safety") return <SafetyMatrix />;
  return null;
}

/* --------- Cycle frigorifique : boucle animée à 4 organes --------- */
function CycleDiagram() {
  const box = (x: number, y: number, emoji: string, label: string, stroke: string) => (
    <g>
      <rect x={x} y={y} width={112} height={54} rx={13} fill="var(--surface-2)" stroke={stroke} strokeWidth={2} />
      <text x={x + 56} y={y + 24} textAnchor="middle" fontSize={19}>{emoji}</text>
      <text x={x + 56} y={y + 43} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--txt)">{label}</text>
    </g>
  );

  return (
    <div className={f.svgwrap}>
      <svg viewBox="0 0 366 286" role="img" aria-label="Cycle frigorifique à compression">
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--lime)" />
          </marker>
        </defs>

        {/* boucle animée derrière les organes */}
        <path d="M75 55 H291 V231 H75 Z" fill="none" stroke="var(--lime)" strokeOpacity="0.28" strokeWidth="2.5"
          strokeDasharray="7 9" className={f.flow} />

        {/* segments + flèches de sens */}
        <line x1="75" y1="203" x2="75" y2="83" stroke="var(--lime)" strokeWidth="2.5" markerEnd="url(#ar)" strokeOpacity="0.55" />
        <line x1="133" y1="55" x2="228" y2="55" stroke="var(--lime)" strokeWidth="2.5" markerEnd="url(#ar)" strokeOpacity="0.55" />
        <line x1="291" y1="83" x2="291" y2="203" stroke="var(--lime)" strokeWidth="2.5" markerEnd="url(#ar)" strokeOpacity="0.55" />
        <line x1="228" y1="231" x2="133" y2="231" stroke="var(--lime)" strokeWidth="2.5" markerEnd="url(#ar)" strokeOpacity="0.55" />

        {/* labels d'état */}
        <text x="68" y="147" textAnchor="end" fontSize="9.5" fill="var(--coral)">vapeur HP</text>
        <text x="180" y="46" textAnchor="middle" fontSize="9.5" fill="var(--coral)">liquide HP</text>
        <text x="298" y="147" textAnchor="start" fontSize="9.5" fill="var(--sky)">détente</text>
        <text x="180" y="246" textAnchor="middle" fontSize="9.5" fill="var(--sky)">vapeur BP</text>

        {/* organes */}
        {box(19, 28, "🔥", "Condenseur", "var(--coral)")}
        {box(235, 28, "💧", "Détendeur", "var(--violet)")}
        {box(235, 204, "❄️", "Évaporateur", "var(--sky)")}
        {box(19, 204, "🔧", "Compresseur", "var(--amber)")}

        {/* chaleur */}
        <text x="75" y="18" textAnchor="middle" fontSize="9" fill="var(--coral)">↑ chaleur rejetée</text>
        <text x="291" y="278" textAnchor="middle" fontSize="9" fill="var(--sky)">↓ froid produit</text>
      </svg>
      <div className={f.svgcap}><span style={{ color: "var(--coral)" }}>● HP (haute pression)</span> &nbsp; <span style={{ color: "var(--sky)" }}>● BP (basse pression)</span></div>
    </div>
  );
}

/* --------- Jauge bouteille de récupération : 80 % max --------- */
function BottleGauge() {
  return (
    <div className={f.svgwrap}>
      <svg viewBox="0 0 220 200" role="img" aria-label="Bouteille de récupération remplie à 80 % maximum">
        {/* col + robinet */}
        <rect x="96" y="10" width="28" height="18" rx="4" fill="var(--surface-2)" stroke="var(--card-bd)" strokeWidth="2" />
        <rect x="86" y="26" width="48" height="12" rx="4" fill="var(--surface-2)" stroke="var(--card-bd)" strokeWidth="2" />
        {/* corps */}
        <rect x="64" y="38" width="92" height="150" rx="22" fill="var(--surface)" stroke="var(--card-bd)" strokeWidth="2.5" />
        {/* remplissage 80% (depuis le bas) */}
        <clipPath id="btl"><rect x="64" y="38" width="92" height="150" rx="22" /></clipPath>
        <g clipPath="url(#btl)">
          <rect x="64" y="68" width="92" height="120" className={f.liquid} />
          {/* zone interdite au-dessus de 80% */}
          <rect x="64" y="38" width="92" height="30" fill="var(--coral)" fillOpacity="0.12" />
        </g>
        {/* ligne 80% */}
        <line x1="52" y1="68" x2="168" y2="68" stroke="var(--coral)" strokeWidth="2" strokeDasharray="5 4" />
        <text x="172" y="65" fontSize="13" fontWeight="700" fill="var(--coral)">80 %</text>
        <text x="172" y="79" fontSize="8.5" fill="var(--txt-2)">max</text>
        {/* marge dilatation */}
        <text x="110" y="55" textAnchor="middle" fontSize="8.5" fill="var(--coral)">marge de dilatation</text>
        <text x="110" y="135" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0a1400">liquide</text>
      </svg>
      <div className={f.svgcap}>Ne jamais dépasser 80 % · une bouteille = un seul fluide</div>
    </div>
  );
}

/* --------- Matrice de classification de sécurité --------- */
const MATRIX: { tox: string; flam: string; risk: "ok" | "mid" | "bad"; fluids: string }[] = [
  { tox: "A", flam: "1", risk: "ok", fluids: "R-134a · R-410A · R-744 (CO₂)" },
  { tox: "A", flam: "2L", risk: "mid", fluids: "R-32 · R-1234yf" },
  { tox: "A", flam: "2", risk: "mid", fluids: "—" },
  { tox: "A", flam: "3", risk: "bad", fluids: "R-290 · R-600a" },
  { tox: "B", flam: "1", risk: "mid", fluids: "toxiques non inflammables" },
  { tox: "B", flam: "2L", risk: "bad", fluids: "R-717 (ammoniac)" },
];
function SafetyMatrix() {
  const col = (r: string) => (r === "ok" ? "var(--lime)" : r === "mid" ? "var(--amber)" : "var(--coral)");
  return (
    <div className={f.matrix}>
      <div className={f.mathead}>
        <span>Classe</span><span>Toxicité</span><span>Inflammabilité</span><span>Exemples</span>
      </div>
      {MATRIX.map((m) => (
        <div key={m.tox + m.flam} className={f.matrow}>
          <span className={f.matclass} style={{ color: col(m.risk), borderColor: col(m.risk) }}>{m.tox}{m.flam}</span>
          <span>{m.tox === "A" ? "faible" : "élevée"}</span>
          <span>{m.flam === "1" ? "aucune" : m.flam === "2L" ? "faible" : m.flam === "2" ? "moyenne" : "forte"}</span>
          <span className={f.matfluids}>{m.fluids}</span>
        </div>
      ))}
    </div>
  );
}
