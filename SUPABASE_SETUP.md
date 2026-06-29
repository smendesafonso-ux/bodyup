# Activer les comptes BODYUP (Supabase) — guide pas à pas

Le front reste hébergé gratuitement sur GitHub Pages. Supabase fournit
l'authentification et la base de données (offre gratuite largement suffisante).

## 1. Créer le projet Supabase (~3 min)

1. Va sur https://supabase.com → **Start your project** → connecte-toi (GitHub possible).
2. **New project** :
   - Name : `bodyup`
   - Database password : choisis-en un et **garde-le** (sert à l'admin, pas à l'app).
   - Region : `West EU (Paris)` ou la plus proche.
3. Attends ~1 min que le projet se provisionne.

## 2. Créer les tables

1. Menu de gauche → **SQL Editor** → **New query**.
2. Ouvre le fichier `supabase/schema.sql` de ce repo, copie tout, colle, puis **Run**.
3. Tu dois voir « Success. No rows returned ». Les tables et la sécurité sont en place.

## 3. Récupérer les 2 valeurs à me transmettre

Menu de gauche → **Project Settings** → **API** :

- **Project URL** — ressemble à `https://xxxxxxxx.supabase.co`
- **Project API keys → `anon` `public`** — une longue chaîne `eyJ...`

> ⚠️ Donne uniquement la clé **anon / public** (elle est conçue pour être publique,
> la sécurité est assurée par les règles RLS). Ne partage **jamais** la clé `service_role`.

## 4. Configurer l'authentification

Menu **Authentication** → **Providers** :

- **Email** : activé par défaut. Pour tester vite sans email de confirmation,
  va dans **Authentication → Sign In / Providers → Email** et désactive
  temporairement « Confirm email » (réactive-le en prod).
- **Google / Apple** (optionnel, plus tard) : nécessitent une config OAuth dédiée.

Menu **Authentication → URL Configuration** :

- **Site URL** : `https://smendesafonso-ux.github.io/bodyup/`
- **Redirect URLs** : ajoute `https://smendesafonso-ux.github.io/bodyup/**`
  et `http://localhost:3000/**` (pour le dev local).

## 5. Me transmettre les valeurs

Colle-moi dans le chat :

```
SUPABASE_URL = https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY = eyJ...
```

Je câble alors l'inscription/connexion, la sauvegarde du profil et du journal,
puis je redéploie. Côté variables :

- **Local** : fichier `.env.local` (déjà ignoré par git) avec
  `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **GitHub Actions** : repo → **Settings → Secrets and variables → Actions →
  Variables** → ajoute les deux mêmes noms (la clé anon n'est pas un secret).
