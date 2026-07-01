// Génère les icônes PNG de la PWA à partir d'un SVG (charte BODYUP). Build-time.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PUB = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(PUB, { recursive: true });

// Icône « maskable » : contenu dans la zone centrale sûre (~72%), fond plein.
const svg = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}"/>
  <rect x="146" y="146" width="220" height="220" rx="58" fill="#c9ff3c"/>
  <path d="M212 258l30 30 62-66" fill="none" stroke="#0a1400" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const tasks = [
  { name: "icon-192.png", size: 192, bg: "#0a0d09" },
  { name: "icon-512.png", size: 512, bg: "#0a0d09" },
  { name: "icon-maskable-512.png", size: 512, bg: "#0a0d09" },
  { name: "apple-touch-icon.png", size: 180, bg: "#0a0d09" },
  { name: "favicon-32.png", size: 32, bg: "#0a0d09" },
];
for (const t of tasks) {
  await sharp(Buffer.from(svg(t.bg))).resize(t.size, t.size).png().toFile(join(PUB, t.name));
  console.log("✓", t.name);
}
console.log("Icônes générées dans /public");
