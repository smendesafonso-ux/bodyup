// Contenu pédagogique pour l'Attestation d'aptitude — catégorie I (fluides frigorigènes).
// Outil de révision personnel : fiches VISUELLES (blocs) + banque de questions adaptatives.
// ⚠️ Aide à la révision — à recouper avec le référentiel officiel en vigueur (règlement (UE) 517/2014,
// arrêtés relatifs à la manipulation des fluides frigorigènes). Les seuils sont donnés à titre indicatif.

export type ThemeId = "thermo" | "fluides" | "reglementation" | "etancheite" | "composants" | "manipulation";

export interface Theme {
  id: ThemeId;
  title: string;
  emoji: string;
  color: string;
  short: string;
}

export const THEMES: Theme[] = [
  { id: "thermo", title: "Thermodynamique & cycle frigorifique", emoji: "🌡️", color: "var(--sky)", short: "Cycle, pressions, surchauffe" },
  { id: "fluides", title: "Les fluides frigorigènes", emoji: "🧪", color: "var(--lime)", short: "Familles, désignation, sécurité" },
  { id: "reglementation", title: "Environnement & réglementation F-Gas", emoji: "🌍", color: "var(--violet)", short: "GWP, ODP, quotas, obligations" },
  { id: "etancheite", title: "Contrôle d'étanchéité", emoji: "🔍", color: "var(--coral)", short: "Fréquences, méthodes, détecteurs" },
  { id: "composants", title: "Composants de l'installation", emoji: "⚙️", color: "var(--amber)", short: "Compresseur, détendeur, échangeurs" },
  { id: "manipulation", title: "Manipulation & bonnes pratiques", emoji: "🧰", color: "#7ee0b0", short: "Récupération, vide, brasage, sécurité" },
];

export const themeById = (id: ThemeId) => THEMES.find((t) => t.id === id)!;

/* -------------------------------------------------------------------------- */
/*  FICHES DE RÉVISION — modèle par blocs visuels                             */
/* -------------------------------------------------------------------------- */
// Le texte accepte le gras **comme ceci**.

export type DiagramId = "cycle" | "bottle80" | "safety";

export type Cell = string | { t: string; c?: string; b?: boolean };

export type Block =
  | { type: "points"; items: string[] }
  | { type: "callout"; tone: "memo" | "warn" | "info"; text: string }
  | { type: "diagram"; id: DiagramId }
  | { type: "table"; head: string[]; rows: Cell[][]; caption?: string }
  | { type: "cards"; cols?: 2 | 3; items: { emoji?: string; title: string; sub?: string; color?: string; tags?: string[] }[] }
  | { type: "compare"; a: { title: string; color: string; points: string[] }; b: { title: string; color: string; points: string[] } }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "bars"; unit?: string; max: number; note?: string; items: { label: string; value: number; color?: string; display?: string }[] };

export interface FicheSection { h: string; blocks: Block[] }
export interface Fiche { intro: string; sections: FicheSection[] }

export const FICHES: Record<ThemeId, Fiche> = {
  thermo: {
    intro: "Le froid ne se « crée » pas : on **déplace la chaleur** d'un endroit froid vers un endroit chaud. Le fluide frigorigène transporte cette chaleur en **changeant d'état**, en boucle fermée.",
    sections: [
      {
        h: "Le cycle à compression",
        blocks: [
          { type: "diagram", id: "cycle" },
          { type: "callout", tone: "memo", text: "**Compression → Condensation → Détente → Évaporation**, en boucle. Le compresseur et le condenseur = côté **HP** ; le détendeur détend vers l'évaporateur = côté **BP**." },
        ],
      },
      {
        h: "Rôle de chaque organe",
        blocks: [
          {
            type: "table",
            head: ["Organe", "Ce qu'il fait", "Côté"],
            rows: [
              [{ t: "🔧 Compresseur", b: true }, "Aspire la vapeur BP, la refoule en HP (vapeur chaude)", { t: "BP → HP", c: "var(--coral)" }],
              [{ t: "🔥 Condenseur", b: true }, "Rejette la chaleur → la vapeur se condense (liquide)", { t: "HP", c: "var(--coral)" }],
              [{ t: "💧 Détendeur", b: true }, "Chute de pression → le liquide se refroidit fortement", { t: "HP → BP", c: "var(--sky)" }],
              [{ t: "❄️ Évaporateur", b: true }, "Absorbe la chaleur → le liquide s'évapore (le froid !)", { t: "BP", c: "var(--sky)" }],
            ],
          },
        ],
      },
      {
        h: "Surchauffe & sous-refroidissement",
        blocks: [
          {
            type: "compare",
            a: {
              title: "🌡️ Surchauffe", color: "var(--coral)",
              points: [
                "Mesurée sur la **vapeur** en sortie d'évaporateur",
                "Écart avec la température d'évaporation",
                "Garantit qu'**aucun liquide** n'arrive au compresseur",
                "Trop faible → **coups de liquide** (compresseur détruit)",
              ],
            },
            b: {
              title: "🧊 Sous-refroidissement", color: "var(--sky)",
              points: [
                "Mesuré sur le **liquide** en sortie de condenseur",
                "Écart avec la température de condensation",
                "Garantit un **liquide pur** (sans bulles) au détendeur",
                "Trop faible → détendeur mal alimenté, rendement en baisse",
              ],
            },
          },
        ],
      },
      {
        h: "Pression ⇄ température",
        blocks: [
          { type: "points", items: [
            "Pour un fluide **pur** en changement d'état : à **une pression** correspond **une température** (saturation).",
            "On **monte** la pression (compresseur) pour condenser à température ambiante.",
            "On **baisse** la pression (détendeur) pour évaporer à basse température.",
          ] },
          { type: "callout", tone: "info", text: "Le **diagramme enthalpique (log p – h)** trace le cycle : pression en ordonnée (log), enthalpie en abscisse. La « cloche » sépare liquide / mélange / vapeur." },
        ],
      },
    ],
  },

  fluides: {
    intro: "Un fluide frigorigène change d'état facilement aux pressions utiles. On les classe par **famille chimique**, par **impact environnemental** (ODP, GWP) et par **sécurité** (toxicité / inflammabilité).",
    sections: [
      {
        h: "Les grandes familles",
        blocks: [
          {
            type: "table",
            head: ["Famille", "Exemple", "ODP", "GWP", "Statut"],
            rows: [
              [{ t: "CFC", b: true }, "R-12", { t: "Élevé", c: "var(--coral)" }, { t: "Élevé", c: "var(--coral)" }, { t: "Interdit", c: "var(--coral)" }],
              [{ t: "HCFC", b: true }, "R-22", { t: "Faible", c: "var(--amber)" }, "~1810", { t: "Interdit (neuf)", c: "var(--coral)" }],
              [{ t: "HFC", b: true }, "R-404A", { t: "0", c: "var(--lime)" }, { t: "Élevé", c: "var(--coral)" }, { t: "Quotas F-Gas", c: "var(--amber)" }],
              [{ t: "HFO", b: true }, "R-1234yf", { t: "0", c: "var(--lime)" }, { t: "Très faible", c: "var(--lime)" }, { t: "Autorisé (A2L)", c: "var(--lime)" }],
              [{ t: "Naturels", b: true }, "CO₂ · NH₃ · HC", { t: "0", c: "var(--lime)" }, { t: "≈ 0", c: "var(--lime)" }, { t: "Encouragés", c: "var(--lime)" }],
            ],
          },
        ],
      },
      {
        h: "GWP : l'écart est énorme",
        blocks: [
          {
            type: "bars", max: 3922, unit: "", note: "GWP indicatif (effet de serre, CO₂ = 1). 1 kg de R-404A ≈ 3922 kg de CO₂ !",
            items: [
              { label: "CO₂ (R-744)", value: 1, display: "1", color: "var(--lime)" },
              { label: "Propane (R-290)", value: 3, display: "3", color: "var(--lime)" },
              { label: "R-1234yf (HFO)", value: 4, display: "≈4", color: "var(--lime)" },
              { label: "R-32", value: 675, display: "675", color: "var(--amber)" },
              { label: "R-134a", value: 1430, display: "1430", color: "var(--coral)" },
              { label: "R-410A", value: 2088, display: "2088", color: "var(--coral)" },
              { label: "R-404A", value: 3922, display: "3922", color: "var(--coral)" },
            ],
          },
        ],
      },
      {
        h: "Classification de sécurité",
        blocks: [
          { type: "diagram", id: "safety" },
          { type: "callout", tone: "memo", text: "**Lettre = toxicité** (A faible, B élevée). **Chiffre = inflammabilité** (1 non, 2L faible, 2 moyenne, 3 forte)." },
        ],
      },
      {
        h: "Corps purs & mélanges",
        blocks: [
          {
            type: "compare",
            a: {
              title: "Azéotrope (série 500)", color: "var(--sky)",
              points: ["Se comporte comme un **corps pur**", "**Pas de glissement** de température", "Ex : R-507"],
            },
            b: {
              title: "Zéotrope (série 400)", color: "var(--amber)",
              points: ["**Glissement** de température (glide)", "La composition change en changeant d'état", "⚠️ Se charge **en phase liquide**", "Ex : R-407C, R-404A"],
            },
          },
          { type: "callout", tone: "warn", text: "Un mélange zéotrope se **charge toujours en phase liquide** : une fuite ou une charge en vapeur déséquilibre le mélange." },
        ],
      },
    ],
  },

  reglementation: {
    intro: "Deux enjeux distincts : la **couche d'ozone** (protocole de Montréal → ODP) et l'**effet de serre** (règlement F-Gas → GWP). L'attestation d'aptitude est obligatoire pour manipuler les fluides.",
    sections: [
      {
        h: "ODP vs GWP : ne pas confondre",
        blocks: [
          {
            type: "cards", cols: 2,
            items: [
              { emoji: "🕳️", title: "ODP", sub: "Appauvrissement de la couche d'ozone. Référence R-11 = 1. Les HFC ont un ODP = 0.", color: "var(--sky)", tags: ["Ozone", "Montréal"] },
              { emoji: "🌡️", title: "GWP", sub: "Potentiel de réchauffement global sur 100 ans. Référence CO₂ = 1.", color: "var(--coral)", tags: ["Climat", "F-Gas"] },
            ],
          },
        ],
      },
      {
        h: "La tonne équivalent CO₂ (téqCO₂)",
        blocks: [
          { type: "callout", tone: "memo", text: "**téqCO₂ = masse (tonnes) × GWP**, soit **(kg ÷ 1000) × GWP**. C'est l'unité de référence pour les obligations de contrôle." },
          {
            type: "table", head: ["Exemple", "Calcul", "Résultat"],
            rows: [
              ["5 kg de R-410A (GWP 2088)", "(5 ÷ 1000) × 2088", { t: "≈ 10,4 téqCO₂", c: "var(--lime)", b: true }],
              ["1 kg de R-404A (GWP 3922)", "(1 ÷ 1000) × 3922", { t: "≈ 3,9 téqCO₂", c: "var(--lime)", b: true }],
              ["3 kg de R-134a (GWP 1430)", "(3 ÷ 1000) × 1430", { t: "≈ 4,3 téqCO₂", c: "var(--lime)", b: true }],
            ],
          },
        ],
      },
      {
        h: "Les textes clés",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Protocole de Montréal (1987)", text: "Élimine les substances qui détruisent l'ozone : d'abord les CFC, puis les HCFC." },
              { title: "Règlement (UE) 517/2014 « F-Gas »", text: "Encadre les gaz fluorés : quotas HFC en baisse (phase-down), interdictions selon le GWP, contrôles et récupération obligatoires." },
            ],
          },
        ],
      },
      {
        h: "Les catégories d'attestation",
        blocks: [
          {
            type: "table", head: ["Cat.", "Périmètre autorisé"],
            rows: [
              [{ t: "I", c: "var(--lime)", b: true }, { t: "Toutes les opérations, sur tous les équipements, sans limite de charge", b: true }],
              [{ t: "II", b: true }, "Charge limitée / contrôle d'étanchéité sans ouverture du circuit"],
              [{ t: "III", b: true }, "Récupération sur équipements de faible charge"],
              [{ t: "IV", b: true }, "Contrôle d'étanchéité seul, sans ouverture du circuit"],
            ],
            caption: "La catégorie I couvre tout. (Périmètres II–IV indicatifs, à vérifier au référentiel.)",
          },
        ],
      },
      {
        h: "Obligations de l'opérateur",
        blocks: [
          { type: "points", items: [
            "Détenir l'**attestation d'aptitude** correspondant aux opérations ; l'entreprise détient l'**attestation de capacité** + les outillages.",
            "Tenir un **registre / fiche d'intervention** et le conserver **5 ans**.",
            "**Interdiction de dégazer** volontairement le fluide dans l'atmosphère.",
          ] },
        ],
      },
    ],
  },

  etancheite: {
    intro: "Une installation étanche = moins d'émissions et de recharges. La F-Gas impose des **contrôles périodiques dont la fréquence dépend de la charge en téqCO₂**.",
    sections: [
      {
        h: "Fréquences de contrôle",
        blocks: [
          {
            type: "table", head: ["Charge (téqCO₂)", "Sans détection", "Avec détection fixe"],
            rows: [
              [{ t: "< 5", b: true }, { t: "Aucun contrôle", c: "var(--txt-2)" }, "—"],
              [{ t: "5 – 50", b: true }, { t: "12 mois", c: "var(--lime)" }, { t: "24 mois", c: "var(--sky)" }],
              [{ t: "50 – 500", b: true }, { t: "6 mois", c: "var(--amber)" }, { t: "12 mois", c: "var(--sky)" }],
              [{ t: "≥ 500", b: true }, { t: "3 mois", c: "var(--coral)" }, { t: "6 mois", c: "var(--sky)" }],
            ],
            caption: "Équipement hermétiquement scellé et étiqueté : seuil relevé à < 10 téqCO₂.",
          },
          { type: "callout", tone: "warn", text: "À partir de **500 téqCO₂** : un **système de détection de fuites fixe est obligatoire** (et le contrôle passe à 3 mois)." },
        ],
      },
      {
        h: "Le bonus détection",
        blocks: [
          { type: "callout", tone: "memo", text: "Un **système de détection fixe** permet de **doubler** les intervalles de contrôle (6 mois → 12 mois). Ce système doit lui-même être **vérifié tous les 12 mois**." },
        ],
      },
      {
        h: "Méthodes de détection",
        blocks: [
          {
            type: "compare",
            a: {
              title: "🎯 Directes", color: "var(--lime)",
              points: ["Détecteur électronique de fuite", "Eau savonneuse / mousse", "Lampe UV + traceur fluorescent", "Azote sous pression"],
            },
            b: {
              title: "📉 Indirectes", color: "var(--sky)",
              points: ["Analyse des pressions & températures", "Niveau d'huile, intensité électrique", "Sous-refroidissement anormal", "= symptômes d'une perte de charge"],
            },
          },
          { type: "callout", tone: "info", text: "Le détecteur électronique doit être **contrôlé / calibré au moins tous les 12 mois** (sensibilité de l'ordre de 5 g/an)." },
        ],
      },
      {
        h: "Après réparation d'une fuite",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Réparer", text: "Intervenir sur la fuite identifiée." },
              { title: "Contrôler la zone réparée", text: "Vérifier l'étanchéité localement." },
              { title: "Contrôle de suivi", text: "Nouveau contrôle dans le mois pour valider l'efficacité de la réparation." },
              { title: "Tracer", text: "Consigner l'intervention au registre." },
            ],
          },
        ],
      },
    ],
  },

  composants: {
    intro: "Connaître le rôle de chaque organe permet de diagnostiquer, contrôler et intervenir sans erreur. Voici les composants d'un circuit à compression.",
    sections: [
      {
        h: "Situer les organes sur le cycle",
        blocks: [
          { type: "diagram", id: "cycle" },
        ],
      },
      {
        h: "Organes principaux & annexes",
        blocks: [
          {
            type: "table", head: ["Composant", "Rôle"],
            rows: [
              [{ t: "🔧 Compresseur", b: true }, "Met le fluide en mouvement et élève la pression (le « cœur »)"],
              [{ t: "🔥 Condenseur", b: true }, "Échangeur HP : le fluide rejette la chaleur et se condense"],
              [{ t: "💧 Détendeur", b: true }, "Dose le débit vers l'évaporateur et fait chuter la pression"],
              [{ t: "❄️ Évaporateur", b: true }, "Échangeur BP : le fluide absorbe la chaleur et produit le froid"],
              [{ t: "🛢️ Bouteille liquide", b: true }, "Stocke le liquide, amortit les variations de charge"],
              [{ t: "🧽 Déshydrateur", b: true }, "Capte l'humidité et les impuretés (eau → acides → corrosion)"],
              [{ t: "👁️ Voyant liquide", b: true }, "Contrôle visuel : des bulles = manque de charge / sous-refroidissement"],
            ],
          },
        ],
      },
      {
        h: "Sécurités (pressostats)",
        blocks: [
          {
            type: "cards", cols: 3,
            items: [
              { emoji: "🔴", title: "Pressostat HP", sub: "Coupe si la haute pression devient dangereuse (condenseur encrassé, ventilateur en panne).", color: "var(--coral)" },
              { emoji: "🔵", title: "Pressostat BP", sub: "Protège d'une pression trop basse (manque de charge, évaporateur givré).", color: "var(--sky)" },
              { emoji: "🛢️", title: "Différentiel d'huile", sub: "Vérifie la lubrification du compresseur.", color: "var(--amber)" },
            ],
          },
        ],
      },
      {
        h: "Le rôle de l'huile",
        blocks: [
          { type: "points", items: [
            "L'huile lubrifie le compresseur mais **circule avec le fluide** dans tout le circuit → elle doit **revenir** au compresseur (pentes, vitesses suffisantes).",
            "Elle doit être **compatible** avec le fluide (POE pour les HFC).",
          ] },
          { type: "callout", tone: "warn", text: "Les huiles **POE** (HFC) sont très **hygroscopiques** : elles absorbent vite l'humidité → limiter l'ouverture du circuit et bien tirer au vide." },
        ],
      },
    ],
  },

  manipulation: {
    intro: "Le savoir-faire pratique : intervenir proprement, **récupérer sans rejet**, tirer au vide, charger et braser dans les règles, en sécurité.",
    sections: [
      {
        h: "Que faire du fluide usagé ?",
        blocks: [
          {
            type: "cards", cols: 2,
            items: [
              { emoji: "♻️", title: "Récupération", sub: "Retirer le fluide vers une bouteille adaptée (jamais de rejet). Obligatoire avant ouverture / fin de vie.", color: "var(--lime)" },
              { emoji: "🧴", title: "Recyclage", sub: "Nettoyage de base (filtration, déshydratation) pour réemploi, souvent sur site.", color: "var(--sky)" },
              { emoji: "🏭", title: "Régénération", sub: "Retraitement poussé en usine pour retrouver les specs d'un fluide neuf.", color: "var(--violet)" },
              { emoji: "🔥", title: "Destruction", sub: "Élimination par procédé agréé (incinération haute température).", color: "var(--coral)" },
            ],
          },
        ],
      },
      {
        h: "Déroulé d'une intervention propre",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Récupérer le fluide", text: "Vers une bouteille de récupération dédiée — jamais à l'atmosphère." },
              { title: "Tirer au vide", text: "Éliminer l'air et l'humidité (incondensables). Viser un vide poussé (~500 microns) et vérifier sa tenue." },
              { title: "Braser sous azote", text: "Balayage d'azote (gaz inerte) pour éviter la calamine à l'intérieur des tubes." },
              { title: "Charger", text: "Mélange zéotrope → en phase liquide. Ajuster via la surchauffe et le sous-refroidissement." },
            ],
          },
        ],
      },
      {
        h: "Bouteille de récupération",
        blocks: [
          { type: "diagram", id: "bottle80" },
          { type: "callout", tone: "warn", text: "**80 % de remplissage maximum** (marge de dilatation du liquide) · **jamais de mélange** de fluides (une bouteille = un fluide, sinon destruction)." },
        ],
      },
      {
        h: "Sécurité & EPI",
        blocks: [
          {
            type: "cards", cols: 3,
            items: [
              { emoji: "🧤", title: "Gelures", sub: "Le fluide liquide gèle la peau → gants + lunettes.", color: "var(--sky)" },
              { emoji: "💨", title: "Anoxie", sub: "Fluides + lourds que l'air → s'accumulent au sol → ventiler.", color: "var(--amber)" },
              { emoji: "💥", title: "Jamais d'oxygène", sub: "O₂ + huile sous pression = explosion. Mise en pression à l'azote.", color: "var(--coral)" },
            ],
          },
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/*  BANQUE DE QUESTIONS                                                        */
/* -------------------------------------------------------------------------- */

export interface Question {
  id: string;
  theme: ThemeId;
  d: 1 | 2 | 3;            // difficulté
  q: string;
  options: string[];
  correct: number;         // index de la bonne réponse
  why: string;             // explication affichée après réponse
}

export const QUESTIONS: Question[] = [
  /* ---------- THERMO ---------- */
  { id: "thermo1", theme: "thermo", d: 1, q: "Dans quel organe le fluide frigorigène produit-il le froid (absorbe la chaleur) ?", options: ["Le condenseur", "L'évaporateur", "Le compresseur", "Le détendeur"], correct: 1, why: "Dans l'évaporateur, le fluide liquide BP absorbe la chaleur du milieu à refroidir et s'évapore : c'est là que le froid est produit." },
  { id: "thermo2", theme: "thermo", d: 1, q: "Quel organe élève la pression du fluide ?", options: ["Le détendeur", "Le condenseur", "Le compresseur", "La bouteille liquide"], correct: 2, why: "Le compresseur aspire la vapeur basse pression et la refoule à haute pression : c'est le moteur du cycle." },
  { id: "thermo3", theme: "thermo", d: 2, q: "À quoi sert la surchauffe en sortie d'évaporateur ?", options: ["À augmenter le rendement du condenseur", "À garantir qu'aucun liquide n'atteint le compresseur", "À sous-refroidir le liquide", "À baisser la pression de refoulement"], correct: 1, why: "La surchauffe assure que la vapeur est entièrement gazeuse : elle protège le compresseur des coups de liquide, qui sont destructeurs." },
  { id: "thermo4", theme: "thermo", d: 2, q: "Le sous-refroidissement se mesure :", options: ["Sur la vapeur en sortie d'évaporateur", "Sur le liquide en sortie de condenseur", "Sur le refoulement du compresseur", "À l'entrée du compresseur"], correct: 1, why: "Le sous-refroidissement est l'écart entre la température du liquide en sortie de condenseur et la température de condensation : il garantit un liquide pur au détendeur." },
  { id: "thermo5", theme: "thermo", d: 2, q: "Que se passe-t-il pour le fluide au passage du détendeur ?", options: ["Sa pression augmente", "Sa pression chute brutalement", "Il se condense", "Sa température augmente"], correct: 1, why: "Le détendeur fait chuter la pression HP → BP ; une partie du liquide se vaporise (flash) et la température chute fortement." },
  { id: "thermo6", theme: "thermo", d: 1, q: "Dans quel ordre s'enchaînent les 4 étapes du cycle ?", options: ["Compression, condensation, détente, évaporation", "Évaporation, détente, condensation, compression", "Condensation, compression, évaporation, détente", "Détente, évaporation, condensation, compression"], correct: 0, why: "Compression → condensation → détente → évaporation, en boucle fermée." },
  { id: "thermo7", theme: "thermo", d: 3, q: "Pour un fluide pur, à une pression donnée en changement d'état correspond :", options: ["Plusieurs températures possibles", "Une seule température (saturation)", "Aucune température précise", "Une enthalpie nulle"], correct: 1, why: "Pour un corps pur, pression et température de saturation sont liées : c'est le principe qui permet de choisir les pressions de travail." },
  { id: "thermo8", theme: "thermo", d: 3, q: "Sur le diagramme enthalpique (log p – h), que lit-on en ordonnée ?", options: ["L'enthalpie", "La pression (échelle log)", "La température", "Le volume massique"], correct: 1, why: "En ordonnée la pression (log p), en abscisse l'enthalpie h. Le cycle s'y trace en un quadrilatère caractéristique." },

  /* ---------- FLUIDES ---------- */
  { id: "fluides1", theme: "fluides", d: 1, q: "Quel type de fluide a l'ODP le plus élevé et est interdit ?", options: ["Les HFC", "Les HFO", "Les CFC", "Le CO₂"], correct: 2, why: "Les CFC (ex R-12) contiennent du chlore et détruisent fortement l'ozone (ODP élevé) : ils sont interdits par le protocole de Montréal." },
  { id: "fluides2", theme: "fluides", d: 2, q: "Comment charge-t-on un mélange zéotrope (série 400) comme le R-407C ?", options: ["En phase vapeur", "En phase liquide", "Peu importe la phase", "Uniquement à froid"], correct: 1, why: "Un zéotrope présente un glissement : sa composition change en changeant d'état. On le charge en phase liquide pour ne pas déséquilibrer le mélange." },
  { id: "fluides3", theme: "fluides", d: 2, q: "Le glissement de température (glide) caractérise :", options: ["Les corps purs", "Les azéotropes", "Les mélanges zéotropes", "Les CFC uniquement"], correct: 2, why: "Les zéotropes (série 400) changent de composition et de température lors du changement d'état : c'est le glissement." },
  { id: "fluides4", theme: "fluides", d: 2, q: "Dans la classification de sécurité, que signifie la classe A3 ?", options: ["Faible toxicité, très inflammable", "Forte toxicité, non inflammable", "Faible toxicité, non inflammable", "Forte toxicité, très inflammable"], correct: 0, why: "A = faible toxicité, 3 = très inflammable. Exemple : le propane R-290 est A3." },
  { id: "fluides5", theme: "fluides", d: 1, q: "Quel fluide naturel a un GWP égal à 1 (la référence) ?", options: ["L'ammoniac R-717", "Le CO₂ R-744", "Le propane R-290", "Le R-134a"], correct: 1, why: "Le CO₂ (R-744) sert de référence : son GWP vaut 1. Il fonctionne toutefois à très hautes pressions." },
  { id: "fluides6", theme: "fluides", d: 3, q: "L'ammoniac (R-717) est classé :", options: ["A1", "A2L", "B2L", "A3"], correct: 2, why: "L'ammoniac est B2L : B = toxique, 2L = faiblement inflammable. Son odeur permet de le détecter très tôt." },
  { id: "fluides7", theme: "fluides", d: 2, q: "Pourquoi le R-22 (HCFC) est-il interdit en fluide neuf ?", options: ["Il est trop cher", "Il a un ODP non nul (attaque l'ozone)", "Il n'est pas assez performant", "Il est trop inflammable"], correct: 1, why: "Les HCFC ont un ODP faible mais non nul : ils attaquent encore la couche d'ozone, d'où leur interdiction progressive." },
  { id: "fluides8", theme: "fluides", d: 3, q: "Les HFO (ex R-1234yf) se distinguent surtout par :", options: ["Un GWP très faible", "Un ODP très élevé", "Une non-inflammabilité totale", "Une toxicité élevée"], correct: 0, why: "Les HFO ont un GWP très faible (souvent < 10), ce qui en fait des remplaçants des HFC ; ils sont généralement A2L (faiblement inflammables)." },

  /* ---------- REGLEMENTATION ---------- */
  { id: "regl1", theme: "reglementation", d: 1, q: "Que mesure le GWP d'un fluide ?", options: ["Son potentiel de destruction de l'ozone", "Son potentiel de réchauffement global", "Son inflammabilité", "Sa toxicité"], correct: 1, why: "Le GWP (Global Warming Potential) mesure l'effet de serre du fluide sur 100 ans, avec le CO₂ comme référence (=1)." },
  { id: "regl2", theme: "reglementation", d: 1, q: "Que mesure l'ODP ?", options: ["Le réchauffement global", "L'appauvrissement de la couche d'ozone", "La densité du fluide", "Le rendement frigorifique"], correct: 1, why: "L'ODP (Ozone Depletion Potential) mesure la capacité à détruire l'ozone stratosphérique. Les HFC ont un ODP = 0." },
  { id: "regl3", theme: "reglementation", d: 2, q: "Comment calcule-t-on la charge en tonnes équivalent CO₂ ?", options: ["Masse (kg) × GWP", "Masse (tonnes) × GWP", "GWP ÷ masse", "Masse × ODP"], correct: 1, why: "téqCO₂ = masse en tonnes × GWP, soit (kg ÷ 1000) × GWP. Ex : 5 kg de R-410A (GWP 2088) ≈ 10,4 téqCO₂." },
  { id: "regl4", theme: "reglementation", d: 2, q: "Quel règlement européen encadre les gaz à effet de serre fluorés (quotas HFC) ?", options: ["Le protocole de Montréal", "Le règlement (UE) 517/2014 (F-Gas)", "La directive DEEE", "Le protocole de Kyoto"], correct: 1, why: "Le règlement (UE) 517/2014 dit « F-Gas » organise le phase-down des HFC via des quotas et des interdictions selon le GWP." },
  { id: "regl5", theme: "reglementation", d: 1, q: "Que traite le protocole de Montréal ?", options: ["L'effet de serre", "La protection de la couche d'ozone", "Le recyclage des métaux", "La sécurité électrique"], correct: 1, why: "Le protocole de Montréal (1987) vise l'élimination des substances qui appauvrissent la couche d'ozone (CFC puis HCFC)." },
  { id: "regl6", theme: "reglementation", d: 2, q: "Que couvre la catégorie I de l'attestation d'aptitude ?", options: ["Uniquement le contrôle d'étanchéité", "Uniquement les équipements < 2 kg", "Toutes les opérations sur tous les équipements, sans limite de charge", "Seulement la récupération"], correct: 2, why: "La catégorie I est la plus complète : elle autorise toutes les opérations sur tous les équipements quelle que soit la charge." },
  { id: "regl7", theme: "reglementation", d: 2, q: "Combien de temps l'entreprise doit-elle conserver les fiches d'intervention / le registre ?", options: ["1 an", "2 ans", "5 ans", "10 ans"], correct: 2, why: "Les documents de traçabilité (registre, fiches d'intervention) doivent être conservés au moins 5 ans." },
  { id: "regl8", theme: "reglementation", d: 3, q: "Le dégazage volontaire du fluide dans l'atmosphère est :", options: ["Autorisé en petite quantité", "Interdit", "Autorisé pour les fluides naturels", "Autorisé lors du tirage au vide"], correct: 1, why: "Le rejet volontaire (dégazage) est strictement interdit : le fluide doit toujours être récupéré." },
  { id: "regl9", theme: "reglementation", d: 3, q: "1 kg de R-404A a un GWP ≈ 3922. Sa charge en téqCO₂ est d'environ :", options: ["0,004 téqCO₂", "3,9 téqCO₂", "39 téqCO₂", "3922 téqCO₂"], correct: 1, why: "(1/1000) × 3922 = 3,922 téqCO₂. Le facteur 1000 (kg → tonnes) est essentiel." },

  /* ---------- ETANCHEITE ---------- */
  { id: "etan1", theme: "etancheite", d: 2, q: "À partir de quelle charge un contrôle d'étanchéité périodique devient-il obligatoire (équipement non hermétique) ?", options: ["≥ 5 téqCO₂", "≥ 50 téqCO₂", "≥ 500 téqCO₂", "Dès 1 kg"], correct: 0, why: "Sous 5 téqCO₂, pas d'obligation de contrôle périodique. À partir de 5 téqCO₂, le contrôle devient obligatoire (au moins tous les 12 mois)." },
  { id: "etan2", theme: "etancheite", d: 2, q: "Un équipement entre 50 et 500 téqCO₂ doit être contrôlé au moins :", options: ["Tous les 12 mois", "Tous les 6 mois", "Tous les 3 mois", "Tous les mois"], correct: 1, why: "5–50 téqCO₂ → 12 mois ; 50–500 → 6 mois ; ≥ 500 → 3 mois." },
  { id: "etan3", theme: "etancheite", d: 2, q: "À partir de 500 téqCO₂, quelle obligation supplémentaire s'applique ?", options: ["Un contrôle mensuel", "Un système de détection de fuites fixe", "L'arrêt de l'installation", "Le remplacement du fluide"], correct: 1, why: "Au-delà de 500 téqCO₂ : contrôle au moins tous les 3 mois ET système de détection de fuites obligatoire." },
  { id: "etan4", theme: "etancheite", d: 3, q: "Si un système de détection de fuites fixe est installé, les intervalles de contrôle :", options: ["Sont divisés par deux", "Peuvent être doublés", "Sont supprimés", "Restent inchangés"], correct: 1, why: "La présence d'un système de détection fixe permet de doubler les intervalles (ex : 6 → 12 mois). Ce système doit être vérifié au moins tous les 12 mois." },
  { id: "etan5", theme: "etancheite", d: 1, q: "Laquelle est une méthode directe de détection de fuite ?", options: ["Analyse des pressions de service", "Détecteur électronique / eau savonneuse", "Relevé de la consommation électrique", "Contrôle du niveau d'huile"], correct: 1, why: "Les méthodes directes détectent le fluide au point de fuite (détecteur électronique, mousse, UV). Les méthodes indirectes analysent les paramètres de fonctionnement." },
  { id: "etan6", theme: "etancheite", d: 2, q: "À quelle fréquence minimale doit-on contrôler un détecteur de fuites électronique ?", options: ["Tous les mois", "Tous les 12 mois", "Tous les 5 ans", "Jamais"], correct: 1, why: "Un détecteur de fuites doit être contrôlé/calibré au moins tous les 12 mois pour garantir sa sensibilité." },
  { id: "etan7", theme: "etancheite", d: 3, q: "Après avoir réparé une fuite, que doit-on faire ?", options: ["Rien de plus", "Un contrôle de suivi dans le mois pour vérifier la réparation", "Attendre un an", "Changer tout le circuit"], correct: 1, why: "Après réparation, un contrôle de suivi (dans le mois) vérifie l'efficacité de la réparation, en plus de la tracer au registre." },
  { id: "etan8", theme: "etancheite", d: 1, q: "Un équipement hermétiquement scellé et étiqueté est exempté de contrôle jusqu'à :", options: ["< 5 téqCO₂", "< 10 téqCO₂", "< 50 téqCO₂", "< 100 téqCO₂"], correct: 1, why: "Pour les équipements hermétiquement scellés et étiquetés comme tels, le seuil d'exemption est relevé à moins de 10 téqCO₂." },

  /* ---------- COMPOSANTS ---------- */
  { id: "comp1", theme: "composants", d: 1, q: "Quel composant capte l'humidité et les impuretés du circuit ?", options: ["Le voyant liquide", "Le déshydrateur / filtre", "Le pressostat HP", "Le séparateur d'huile"], correct: 1, why: "Le filtre déshydrateur retient l'humidité et les impuretés : l'eau + fluide forment des acides qui corrodent le circuit." },
  { id: "comp2", theme: "composants", d: 2, q: "Des bulles dans le voyant liquide indiquent le plus souvent :", options: ["Un excès de charge", "Un manque de charge ou de sous-refroidissement", "Un compresseur neuf", "Une pression trop basse à l'aspiration uniquement"], correct: 1, why: "Des bulles au voyant signalent un liquide non pur à cet endroit : manque de charge ou sous-refroidissement insuffisant." },
  { id: "comp3", theme: "composants", d: 2, q: "Rôle du pressostat HP ?", options: ["Réguler la surchauffe", "Couper en cas de haute pression dangereuse", "Filtrer l'huile", "Détendre le fluide"], correct: 1, why: "Le pressostat HP arrête l'installation si la haute pression devient dangereuse (condenseur encrassé, ventilateur en panne…)." },
  { id: "comp4", theme: "composants", d: 1, q: "Quel organe régule le débit de fluide vers l'évaporateur ?", options: ["Le compresseur", "Le détendeur", "La bouteille liquide", "Le condenseur"], correct: 1, why: "Le détendeur dose le fluide vers l'évaporateur et provoque la chute de pression. Il peut être thermostatique, électronique ou capillaire." },
  { id: "comp5", theme: "composants", d: 3, q: "Pourquoi l'huile POE (utilisée avec les HFC) demande-t-elle une vigilance particulière ?", options: ["Elle est inflammable", "Elle est très hygroscopique (absorbe l'eau)", "Elle ne lubrifie pas", "Elle attaque le cuivre"], correct: 1, why: "Les huiles POE sont très hygroscopiques : elles absorbent vite l'humidité de l'air, d'où l'importance de limiter l'ouverture du circuit et de bien tirer au vide." },
  { id: "comp6", theme: "composants", d: 2, q: "Où le fluide rejette-t-il sa chaleur vers l'extérieur ?", options: ["L'évaporateur", "Le condenseur", "Le détendeur", "L'aspiration du compresseur"], correct: 1, why: "Le condenseur (côté HP) évacue la chaleur : le fluide y passe de vapeur à liquide." },
  { id: "comp7", theme: "composants", d: 3, q: "Pourquoi l'huile doit-elle revenir au compresseur ?", options: ["Pour refroidir le condenseur", "Pour lubrifier le compresseur en continu", "Pour augmenter la charge de fluide", "Pour dégivrer l'évaporateur"], correct: 1, why: "L'huile circule avec le fluide ; si elle ne revient pas (pentes, vitesses insuffisantes), le compresseur manque de lubrification et se détériore." },

  /* ---------- MANIPULATION ---------- */
  { id: "mani1", theme: "manipulation", d: 1, q: "À quel taux maximal remplit-on une bouteille de récupération ?", options: ["100 %", "90 %", "80 %", "50 %"], correct: 2, why: "On ne dépasse jamais 80 % : la marge permet la dilatation du liquide et évite l'éclatement de la bouteille." },
  { id: "mani2", theme: "manipulation", d: 2, q: "Pourquoi braser sous balayage d'azote ?", options: ["Pour refroidir le tube", "Pour éviter l'oxydation (calamine) à l'intérieur du tube", "Pour augmenter la pression", "Pour détecter les fuites"], correct: 1, why: "L'azote (gaz inerte) balaie l'intérieur du tube pendant le brasage et empêche la formation de calamine qui polluerait le circuit." },
  { id: "mani3", theme: "manipulation", d: 2, q: "À quoi sert le tirage au vide avant la charge ?", options: ["À refroidir le compresseur", "À éliminer l'air et l'humidité du circuit", "À augmenter la charge de fluide", "À tester le pressostat HP"], correct: 1, why: "Le tirage au vide retire l'air et l'humidité (incondensables) : l'eau forme des acides et givre le détendeur, l'air fait grimper la HP." },
  { id: "mani4", theme: "manipulation", d: 3, q: "Quelle est la différence entre régénération et recyclage ?", options: ["Aucune", "La régénération ramène le fluide aux specs d'un fluide neuf (en usine) ; le recyclage est un nettoyage de base souvent sur site", "Le recyclage détruit le fluide", "La régénération se fait à l'atmosphère"], correct: 1, why: "Recyclage = nettoyage de base (souvent sur site) ; régénération = retraitement poussé en usine pour retrouver les caractéristiques d'un fluide neuf." },
  { id: "mani5", theme: "manipulation", d: 1, q: "Que faut-il faire du fluide avant d'ouvrir un circuit pour intervention ?", options: ["Le laisser s'échapper", "Le récupérer dans une bouteille adaptée", "L'analyser sur place", "Le chauffer"], correct: 1, why: "Le fluide doit être récupéré (jamais rejeté). La récupération est obligatoire avant ouverture du circuit et en fin de vie." },
  { id: "mani6", theme: "manipulation", d: 2, q: "Peut-on mélanger deux fluides différents dans une bouteille de récupération ?", options: ["Oui, si même famille", "Oui, toujours", "Non, jamais", "Oui, si < 80 %"], correct: 2, why: "Jamais : un mélange de fluides est inexploitable et part en destruction. Une bouteille = un fluide." },
  { id: "mani7", theme: "manipulation", d: 2, q: "Quel EPI est indispensable face au risque de gelure et de projection ?", options: ["Un casque uniquement", "Gants et lunettes de protection", "Des bouchons d'oreilles", "Rien de particulier"], correct: 1, why: "Le fluide liquide provoque des gelures et peut être projeté sous pression : gants et lunettes sont indispensables." },
  { id: "mani8", theme: "manipulation", d: 3, q: "Pourquoi ne jamais mettre un circuit en pression avec de l'oxygène ?", options: ["L'oxygène est trop cher", "Risque d'explosion (oxygène + huile/hydrocarbures)", "Cela fausse le manomètre", "L'oxygène gèle les tubes"], correct: 1, why: "L'oxygène sous pression avec de l'huile ou des hydrocarbures peut exploser : on utilise l'azote (inerte) pour les mises en pression et le balayage." },
  { id: "mani9", theme: "manipulation", d: 3, q: "Un fluide plus lourd que l'air qui fuit dans un local fermé présente surtout un risque de :", options: ["Incendie systématique", "Anoxie (manque d'oxygène) au niveau du sol", "Surpression du bâtiment", "Corrosion des murs"], correct: 1, why: "Les fluides plus lourds que l'air s'accumulent au sol et chassent l'oxygène : risque d'anoxie. D'où l'importance de ventiler et de détecter." },
];

export const questionsByTheme = (t: ThemeId) => QUESTIONS.filter((q) => q.theme === t);
