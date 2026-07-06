// Contenu pédagogique pour l'Attestation d'aptitude — catégorie I (fluides frigorigènes).
// Outil de révision personnel : fiches + banque de questions taguées par thème et difficulté.
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
/*  FICHES DE RÉVISION                                                        */
/* -------------------------------------------------------------------------- */
// Le texte accepte le gras **comme ceci**. Chaque section = un titre + des points.

export interface FicheSection { h: string; points: string[]; memo?: string }
export interface Fiche { intro: string; sections: FicheSection[] }

export const FICHES: Record<ThemeId, Fiche> = {
  thermo: {
    intro: "Le froid ne se « crée » pas : on **déplace la chaleur** d'un endroit froid (à refroidir) vers un endroit chaud (l'extérieur). Le fluide frigorigène est le transporteur de cette chaleur, en changeant d'état.",
    sections: [
      {
        h: "Les 4 organes / 4 étapes du cycle à compression",
        points: [
          "**Compresseur** : aspire la vapeur BP (basse pression) et la refoule en HP (haute pression). La vapeur devient **surchauffée et chaude**.",
          "**Condenseur** : la vapeur HP cède sa chaleur à l'extérieur et **se condense** (vapeur → liquide). C'est le côté haute pression.",
          "**Détendeur** : fait chuter brutalement la pression (HP → BP). Une partie du liquide se vaporise (« flash »), la température chute fortement.",
          "**Évaporateur** : le liquide BP absorbe la chaleur du milieu à refroidir et **s'évapore** (liquide → vapeur). C'est là que le froid est produit.",
        ],
        memo: "Compression → Condensation → Détente → Évaporation, en boucle fermée.",
      },
      {
        h: "Pression et température : le lien clé",
        points: [
          "Pour un fluide pur en changement d'état, **à une pression correspond une température** (température de saturation).",
          "On monte la pression (compresseur) pour condenser à température ambiante ; on baisse la pression (détendeur) pour évaporer à basse température.",
          "Côté HP = pression de condensation ; côté BP = pression d'évaporation.",
        ],
      },
      {
        h: "Surchauffe et sous-refroidissement",
        points: [
          "**Surchauffe** = écart entre la température réelle de la vapeur en sortie d'évaporateur et la température d'évaporation. Elle garantit qu'**aucun liquide n'arrive au compresseur** (les coups de liquide le détruisent).",
          "**Sous-refroidissement** = écart entre la température du liquide en sortie de condenseur et la température de condensation. Il garantit un **liquide pur** (sans bulles) à l'entrée du détendeur.",
          "Surchauffe insuffisante → risque de coups de liquide. Sous-refroidissement insuffisant → détendeur mal alimenté, perte de rendement.",
        ],
      },
      {
        h: "Le diagramme enthalpique (log p – h)",
        points: [
          "Outil pour lire le cycle : en abscisse l'**enthalpie** (h, énergie), en ordonnée la **pression** (log p).",
          "La « cloche » sépare liquide (gauche), mélange liquide+vapeur (dessous) et vapeur (droite).",
          "Il permet de lire les pressions, températures, surchauffe, sous-refroidissement et l'effet frigorifique.",
        ],
      },
    ],
  },

  fluides: {
    intro: "Un fluide frigorigène doit changer d'état facilement aux pressions utiles. On les classe par **famille chimique**, par **impact environnemental** et par **sécurité**.",
    sections: [
      {
        h: "Les grandes familles",
        points: [
          "**CFC** (ex : R-12) : chlore + fluor. ODP très élevé → **interdits** (protocole de Montréal).",
          "**HCFC** (ex : R-22) : ODP faible mais non nul → **interdits** à la production/import et en fluide neuf ; recharge en régénéré interdite.",
          "**HFC** (ex : R-134a, R-404A, R-410A, R-32) : ODP nul mais **GWP souvent élevé** → visés par les quotas F-Gas.",
          "**HFO** (ex : R-1234yf, R-1234ze) : GWP très faible, légèrement inflammables (A2L le plus souvent).",
          "**Naturels** : R-717 ammoniac (NH₃), R-744 CO₂, R-290 propane, R-600a isobutane — GWP quasi nul.",
        ],
      },
      {
        h: "Désignation et mélanges",
        points: [
          "Un fluide pur porte un numéro (R-134a). Les **mélanges** sont numérotés en série 400 (**zéotropes**) ou 500 (**azéotropes**).",
          "**Azéotrope** (série 500, ex R-507) : se comporte comme un corps pur, pas de glissement.",
          "**Zéotrope** (série 400, ex R-407C, R-404A) : présente un **glissement de température (glide)** — la composition change en changeant d'état.",
          "⚠️ Un mélange zéotrope se **charge toujours en phase liquide** pour ne pas modifier sa composition. Une fuite le déséquilibre.",
        ],
        memo: "Zéotrope = série 400 = glissement = charge en liquide.",
      },
      {
        h: "Classification de sécurité (ASHRAE / EN 378)",
        points: [
          "**Toxicité** : A = faible, B = élevée.",
          "**Inflammabilité** : 1 = non inflammable, 2L = faiblement inflammable, 2 = inflammable, 3 = très inflammable.",
          "Exemples : R-134a et R-744 (CO₂) → **A1** ; R-32 → **A2L** ; R-290 (propane) → **A3** ; R-717 (ammoniac) → **B2L** (toxique et légèrement inflammable).",
        ],
      },
      {
        h: "Particularités des naturels",
        points: [
          "**CO₂ (R-744)** : GWP = 1, non toxique, ininflammable, mais fonctionne à **très hautes pressions** (cycle souvent transcritique).",
          "**Ammoniac (R-717)** : excellent rendement, GWP nul, mais **toxique et irritant** — odeur détectable très tôt.",
          "**Hydrocarbures (R-290, R-600a)** : très bon rendement, GWP faible, mais **inflammables** → charges limitées et précautions.",
        ],
      },
    ],
  },

  reglementation: {
    intro: "Deux enjeux : la **couche d'ozone** (protocole de Montréal → ODP) et l'**effet de serre** (règlement F-Gas → GWP). L'attestation d'aptitude est obligatoire pour manipuler les fluides.",
    sections: [
      {
        h: "Deux indicateurs à ne pas confondre",
        points: [
          "**ODP** (Ozone Depletion Potential) = potentiel d'appauvrissement de la couche d'ozone. Référence : R-11 = 1. Les HFC ont un **ODP = 0**.",
          "**GWP** (Global Warming Potential) = potentiel de réchauffement global sur 100 ans. Référence : **CO₂ = 1**.",
          "Exemple : R-404A a un GWP ≈ 3922 → 1 kg de R-404A ≈ 3922 kg de CO₂.",
        ],
        memo: "ODP = ozone. GWP = réchauffement. CO₂ = 1.",
      },
      {
        h: "La tonne équivalent CO₂ (téqCO₂)",
        points: [
          "C'est l'unité de référence de la F-Gas pour les obligations de contrôle.",
          "**téqCO₂ = masse de fluide (en tonnes) × GWP**, soit (masse en kg ÷ 1000) × GWP.",
          "Exemple : 5 kg de R-410A (GWP ≈ 2088) → (5/1000) × 2088 ≈ **10,4 téqCO₂**.",
        ],
      },
      {
        h: "Les textes",
        points: [
          "**Protocole de Montréal (1987)** : élimination des substances qui détruisent l'ozone (CFC puis HCFC).",
          "**Règlement (UE) n° 517/2014 (F-Gas)** : encadre les gaz à effet de serre fluorés — **quotas** de HFC en baisse, **interdictions** progressives de mise sur le marché selon le GWP, obligations de contrôle et de récupération.",
          "Objectif : réduire fortement les quantités de HFC mises sur le marché (phase-down).",
        ],
      },
      {
        h: "Obligations de l'opérateur / du technicien",
        points: [
          "Détenir l'**attestation d'aptitude** correspondant aux opérations réalisées.",
          "L'entreprise doit posséder une **attestation de capacité** et les outillages requis (dont un groupe de récupération).",
          "Tenir un **registre / fiche d'intervention** (fluide, quantité chargée/récupérée, contrôles) et le conserver (5 ans).",
          "**Interdiction de dégazer** volontairement le fluide dans l'atmosphère.",
        ],
      },
      {
        h: "Les catégories d'attestation",
        points: [
          "**Catégorie I** : la plus complète — **toutes les opérations** (contrôle d'étanchéité, récupération, mise en service, maintenance) sur **tous les équipements, quelle que soit la charge**.",
          "Catégories II, III, IV : périmètres restreints (charge limitée, ou contrôle d'étanchéité seul sans ouverture du circuit).",
          "👉 Détenir la catégorie I autorise donc l'ensemble des interventions.",
        ],
      },
    ],
  },

  etancheite: {
    intro: "Une installation étanche = moins de fuites = moins d'émissions et de recharges. La F-Gas impose des **contrôles périodiques dont la fréquence dépend de la charge en téqCO₂**.",
    sections: [
      {
        h: "Fréquences de contrôle (règlement 517/2014)",
        points: [
          "**< 5 téqCO₂** : pas d'obligation de contrôle périodique.",
          "**≥ 5 et < 50 téqCO₂** : au moins **tous les 12 mois**.",
          "**≥ 50 et < 500 téqCO₂** : au moins **tous les 6 mois**.",
          "**≥ 500 téqCO₂** : au moins **tous les 3 mois** ET **système de détection de fuites obligatoire**.",
          "Équipements **hermétiquement scellés et étiquetés comme tels** : seuil relevé à **< 10 téqCO₂** avant obligation.",
        ],
        memo: "5 / 50 / 500 → 12 / 6 / 3 mois. ≥500 = détection fixe obligatoire.",
      },
      {
        h: "Le bonus du système de détection",
        points: [
          "Si un **système de détection de fuites fixe** est installé, les intervalles de contrôle peuvent être **doublés** (ex : 6 mois → 12 mois).",
          "Ce système de détection doit lui-même être **vérifié au moins tous les 12 mois**.",
        ],
      },
      {
        h: "Méthodes de contrôle",
        points: [
          "**Méthodes directes** : détecteur électronique de fuite, spray moussant, lampe UV + traceur fluorescent, azote sous pression.",
          "**Méthodes indirectes** : analyse des paramètres (pressions, températures, niveau d'huile, courant, sous-refroidissement anormal…) qui révèlent une perte de charge.",
          "Un détecteur électronique de fuite doit être **contrôlé/calibré périodiquement** (au moins tous les 12 mois) pour rester fiable (sensibilité de l'ordre de 5 g/an).",
        ],
      },
      {
        h: "Après réparation d'une fuite",
        points: [
          "Réparer, puis **contrôler l'étanchéité de la zone réparée**.",
          "Un **contrôle de suivi doit être réalisé** (dans le mois suivant) pour vérifier l'efficacité de la réparation.",
          "Tracer l'intervention dans le registre.",
        ],
      },
    ],
  },

  composants: {
    intro: "Connaître le rôle de chaque organe permet de diagnostiquer, contrôler et intervenir sans erreur. Voici les composants majeurs d'un circuit à compression.",
    sections: [
      {
        h: "Les 4 organes principaux",
        points: [
          "**Compresseur** : le « cœur » — met le fluide en mouvement et élève la pression. Types : hermétique, semi-hermétique, ouvert ; à pistons, scroll, à vis…",
          "**Condenseur** : échangeur côté HP où le fluide rejette la chaleur (à air ou à eau).",
          "**Détendeur** : régule le débit de fluide vers l'évaporateur et fait chuter la pression. Types : thermostatique (TD), électronique, capillaire.",
          "**Évaporateur** : échangeur côté BP où le fluide absorbe la chaleur et produit le froid.",
        ],
      },
      {
        h: "Organes annexes indispensables",
        points: [
          "**Bouteille liquide** (réservoir) : stocke le liquide et amortit les variations de charge.",
          "**Déshydrateur / filtre** : capte l'**humidité** et les impuretés (l'eau + fluide → acides → boues, corrosion).",
          "**Voyant liquide** : contrôle visuel — des bulles signalent un manque de charge ou de sous-refroidissement ; l'indicateur d'humidité change de couleur.",
          "**Séparateur d'huile / anti-coup de liquide** : protège le compresseur.",
        ],
      },
      {
        h: "Sécurités et régulation",
        points: [
          "**Pressostat HP** : coupe si la haute pression devient dangereuse (condenseur encrassé, ventilateur en panne…).",
          "**Pressostat BP** : protège contre une pression trop basse (manque de charge, évaporateur givré…).",
          "**Pressostat différentiel d'huile** : vérifie la lubrification du compresseur.",
        ],
      },
      {
        h: "Le rôle de l'huile",
        points: [
          "L'huile lubrifie le compresseur mais **circule avec le fluide** dans tout le circuit.",
          "Elle doit **revenir au compresseur** (pentes, vitesses de vapeur suffisantes).",
          "L'huile doit être **compatible avec le fluide** (ex : POE pour les HFC, qui est très hygroscopique → attention à l'humidité).",
        ],
      },
    ],
  },

  manipulation: {
    intro: "Le savoir-faire pratique : intervenir proprement, **récupérer sans rejet**, tirer au vide, charger et braser dans les règles, en sécurité.",
    sections: [
      {
        h: "Récupération, recyclage, régénération, destruction",
        points: [
          "**Récupération** : retirer le fluide de l'installation vers une bouteille adaptée (jamais de rejet à l'atmosphère). Obligatoire avant toute ouverture du circuit et en fin de vie.",
          "**Recyclage** : nettoyage de base du fluide (filtration, déshydratation) pour réemploi, souvent **sur site**.",
          "**Régénération** : retraitement poussé (en usine) pour atteindre les caractéristiques d'un fluide **neuf**.",
          "**Destruction** : élimination par un procédé agréé (incinération à haute température).",
        ],
      },
      {
        h: "Bouteilles de récupération — règles de sécurité",
        points: [
          "Utiliser une **bouteille de récupération** dédiée (différente des bouteilles de fluide neuf).",
          "Ne **jamais dépasser 80 % de remplissage** (marge pour la dilatation du liquide → risque d'éclatement).",
          "Ne **jamais mélanger** des fluides différents dans une même bouteille (fluide mélangé = destruction).",
          "Respecter les dates de requalification et les températures de stockage.",
        ],
        memo: "Bouteille de récup : 80 % maxi, jamais de mélange.",
      },
      {
        h: "Tirage au vide",
        points: [
          "Réalisé **après récupération et avant charge** : il élimine l'**air et l'humidité** (incondensables) du circuit.",
          "L'humidité résiduelle forme des acides et peut givrer le détendeur ; l'air fait monter la HP.",
          "On vise un **vide poussé** (de l'ordre de 500 microns / ≈ 0,67 mbar) et on vérifie sa **tenue** (le vide doit se maintenir).",
        ],
      },
      {
        h: "Brasage et charge",
        points: [
          "**Braser sous balayage d'azote** (gaz inerte) pour éviter la formation de calamine/oxydation à l'intérieur des tubes.",
          "L'azote n'est jamais utilisé pour la mise en pression du circuit sans précaution — on ne monte pas en pression avec de l'oxygène (risque d'explosion).",
          "Charger un mélange **zéotrope en phase liquide** ; ajuster la charge en contrôlant surchauffe et sous-refroidissement.",
        ],
      },
      {
        h: "Sécurité & EPI",
        points: [
          "Gants et **lunettes de protection** : le fluide liquide provoque des **gelures**, et sous pression peut projeter.",
          "Ventiler : les fluides plus lourds que l'air s'accumulent au sol et peuvent provoquer une **anoxie** (manque d'oxygène).",
          "Fluides inflammables (A2L, A3) ou toxiques (ammoniac) → procédures et détection spécifiques.",
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
