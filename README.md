# BODYUP — Coach santé IA (Next.js)

Portage React / Next.js (App Router + TypeScript) du prototype BODYUP : nutrition,
activité physique, hydratation et coaching IA. Approche **mobile-first**.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

### Tests

```bash
npm test          # lance la suite Vitest (lib/nutrition.ts)
npm run test:watch
```

Le moteur nutritionnel est couvert par 11 tests unitaires (BMR homme/femme,
TDEE, déficit/surplus, estimation de date, garde-fou « objectif irréaliste »,
bascule maintien). Étant une fonction pure, il se teste sans mock ni DOM.

## Routes

| Route          | Écran                                                        |
| -------------- | ------------------------------------------------------------ |
| `/`            | App mobile — 8 écrans navigables (tab bar + FAB scan)        |
| `/onboarding`  | Parcours animé 7 étapes + calcul BMR/TDEE en direct          |
| `/tablet`      | Dashboard tablette double-colonne (rail latéral, planning)   |

Navigation croisée : le panneau desktop de `/` pointe vers `/onboarding` et `/tablet` ;
le CTA final de l'onboarding redirige vers `/` ; le logo du rail tablette revient sur `/`.

## Architecture

```
app/
  layout.tsx          Polices (Hanken Grotesk via next/font + Clash Display), <body>
  globals.css         Design tokens (CSS variables), reset, fond ambiant
  page.tsx            → MobileApp
  onboarding/page.tsx → Onboarding
  tablet/page.tsx     → Tablet
components/
  MobileApp.tsx       App mobile complète (state d'onglets, 8 écrans)
  Onboarding.tsx      Parcours pas-à-pas (state + buildPlan)
  Tablet.tsx          Dashboard double-colonne
  CalorieRing.tsx     Anneau calorique animé réutilisable (props)
  Icon.tsx            Jeu d'icônes SVG typé
lib/
  nutrition.ts        Mifflin-St Jeor : BMR, TDEE, objectif calorique, date, garde-fous
  data.ts             Données de démonstration (repas, séances, recettes, insights…)
styles/
  *.module.css        Styles scopés par surface (CSS Modules)
```

## Design system

- **Direction** : « tableau de bord d'athlète » — charbon-forêt, lime électrique (accent
  unique), corail / bleu ciel / violet comme signaux de données. Dark mode natif.
- **Typographie** : Clash Display (affichage) + Hanken Grotesk (corps).
- Tous les tokens sont des variables CSS dans `app/globals.css`.

## Déploiement (GitHub Pages, sans backend)

Le projet est exporté en site **100% statique** (`output: "export"` → dossier `out/`)
et déployé automatiquement sur **GitHub Pages** via GitHub Actions
(`.github/workflows/deploy.yml`) à chaque `push` sur `main`.

URL de production : **https://smendesafonso-ux.github.io/bodyup/**

Activation (une seule fois) : repo GitHub → **Settings → Pages → Build and deployment
→ Source : GitHub Actions**.

Build statique en local :

```bash
$env:GITHUB_PAGES="true"; npm run build   # PowerShell
# le site prêt à héberger est dans out/
```

> `basePath`/`assetPrefix` valent `/bodyup` uniquement quand `GITHUB_PAGES=true`,
> pour que les assets se résolvent sous le sous-chemin de Pages. En local (`npm run dev`)
> le site reste servi à la racine.

## À brancher pour la prod

- Auth (Apple / Google / Email) + Supabase (PostgreSQL)
- API NestJS, RAG santé/nutrition, Vision AI (scan photo), Coach OpenAI
- Stripe (Premium), synchronisation Apple Health / Google Fit / Health Connect

## Maquettes statiques d'origine

Les fichiers `index.html`, `onboarding.html` et `tablet.html` à la racine sont les
prototypes HTML/CSS d'origine, conservés pour référence.
