import type { CSSProperties } from "react";

export type IconName =
  | "check" | "home" | "journal" | "meals" | "camera" | "exo" | "spark" | "stats"
  | "flame" | "steps" | "trend" | "clock" | "send" | "play" | "cart" | "plus"
  | "refresh" | "barcode" | "mic" | "heart" | "fit" | "bell" | "info" | "shield"
  | "arrowRight" | "arrowLeft" | "calendar" | "moon" | "diamond" | "target"
  | "arrowUp" | "bolt" | "dashboard" | "settings" | "signal" | "tablet" | "warning" | "flameLine";

interface Props { name: IconName; size?: number; className?: string; style?: CSSProperties }

export function Icon({ name, size = 24, className, style }: Props) {
  const s = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, className, style,
  };
  const fillBox = { width: size, height: size, viewBox: "0 0 24 24", className, style };

  switch (name) {
    case "check": return <svg {...s} strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>;
    case "home": return <svg {...s}><path d="M3 11l9-8 9 8M5 9v11h5v-6h4v6h5V9" /></svg>;
    case "journal": return <svg {...s}><path d="M5 4h11l3 3v13H5z" /><path d="M9 9h6M9 13h6M9 17h3" /></svg>;
    case "meals": return <svg {...s}><path d="M5 3v8a2 2 0 002 2v8M5 3v4M8 3v4M19 3c-2 0-3 2-3 5s1 4 1 4v9" /></svg>;
    case "camera": return <svg {...s}><path d="M3 9a2 2 0 012-2h1l1.5-2h9L19 7h1a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case "exo": return <svg {...s}><path d="M6.5 6.5l11 11M5 8l-1.5-1.5M19 16l1.5 1.5M3 10l3 3M18 11l3 3M8 3l3 3M13 18l3 3" /></svg>;
    case "spark": return <svg {...s}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" /></svg>;
    case "stats": return <svg {...s}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>;
    case "flame": return <svg {...fillBox}><path d="M12 2c1 3.5-1.5 4.5-1.5 7A3.5 3.5 0 0014 11c0-2 2-2.5 2-4 2 2 3 4.5 3 7a7 7 0 11-14 0c0-4 3.5-6 4-9 1.5 1 2.5 2.5 3 5z" fill="currentColor" /></svg>;
    case "flameLine": return <svg {...s}><path d="M12 2c1 3.5-1.5 4.5-1.5 7A3.5 3.5 0 0014 11c0-2 2-2.5 2-4 2 2 3 4.5 3 7a7 7 0 11-14 0c0-4 3.5-6 4-9z" /></svg>;
    case "steps": return <svg {...s}><path d="M19 5L5 19M9 5l-4 4M19 11l-4 4" /></svg>;
    case "trend": return <svg {...s}><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7v5h-5" /></svg>;
    case "clock": return <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "send": return <svg {...s} strokeWidth={2.2}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
    case "play": return <svg {...fillBox}><path d="M8 5v14l11-7z" fill="currentColor" /></svg>;
    case "cart": return <svg {...s}><path d="M3 4h2l2 12h11l2-8H6" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>;
    case "plus": return <svg {...s} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>;
    case "refresh": return <svg {...s}><path d="M3 12a9 9 0 109-9M3 12l3-3M3 12l3 3" /></svg>;
    case "barcode": return <svg {...s}><path d="M4 7v10M8 7v10M12 7v10M16 7v10M20 7v10" /></svg>;
    case "mic": return <svg {...s}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>;
    case "heart": return <svg {...s}><path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5 9 5 12 8 12 8s3-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21z" /></svg>;
    case "fit": return <svg {...s}><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>;
    case "bell": return <svg {...s}><path d="M12 2a7 7 0 00-7 7c0 5-2 6-2 6h18s-2-1-2-6a7 7 0 00-7-7z" /><path d="M10 20a2 2 0 004 0" /></svg>;
    case "info": return <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M9 12h6M12 9v6" /></svg>;
    case "shield": return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case "arrowRight": return <svg {...s}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "arrowLeft": return <svg {...s}><path d="M15 6l-6 6 6 6" /></svg>;
    case "calendar": return <svg {...s}><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 11h16" /></svg>;
    case "moon": return <svg {...s}><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" /></svg>;
    case "diamond": return <svg {...s} strokeWidth={2.2}><path d="M3 7l4 5 5-7 5 7 4-5v11H3z" /></svg>;
    case "target": return <svg {...s}><path d="M12 2v20M2 12h20" /></svg>;
    case "arrowUp": return <svg {...s}><path d="M12 3v18M5 10l7-7 7 7" /></svg>;
    case "bolt": return <svg {...s}><path d="M12 2v6M5 8l3 3M19 8l-3 3M4 16h16" /></svg>;
    case "dashboard": return <svg {...s}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></svg>;
    case "settings": return <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M19 13a1.6 1.6 0 00.3 1.8 2 2 0 11-2.8 2.8 1.6 1.6 0 00-2.7 1.1 2 2 0 11-4 0 1.6 1.6 0 00-2.7-1.1 2 2 0 11-2.8-2.8A1.6 1.6 0 003.6 13a2 2 0 110-4 1.6 1.6 0 001.4-2.3 2 2 0 112.8-2.8A1.6 1.6 0 0010.5 5a2 2 0 114 0 1.6 1.6 0 002.7-1.1 2 2 0 112.8 2.8A1.6 1.6 0 0020.4 9a2 2 0 110 4z" /></svg>;
    case "signal": return <svg {...s}><path d="M12 3v18M5 10l7-7 7 7" /></svg>;
    case "tablet": return <svg {...s}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8" /></svg>;
    case "warning": return <svg {...s}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>;
    default: return null;
  }
}
