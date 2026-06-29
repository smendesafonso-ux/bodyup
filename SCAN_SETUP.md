# Activer le Scan photo IA (Claude) — guide

Le Scan photo envoie la photo à une **Edge Function Supabase** (`analyze-food`) qui
appelle Claude côté serveur. Ta clé Anthropic reste un **secret serveur** — elle n'est
jamais dans le front, le repo, ni le navigateur.

> ⚠️ Ne colle jamais ta clé Claude dans le chat ni dans le code. Tu la mets toi-même
> dans les secrets de la fonction (étape 3).

## 1. Déployer la fonction (Dashboard — le plus simple)

1. Va sur **Edge Functions** : https://supabase.com/dashboard/project/poarxjchlboobosgleaz/functions
2. Clique **Deploy a new function** → **Via Editor** (éditeur en ligne)
3. Nom de la fonction : **`analyze-food`** (exactement)
4. Colle tout le contenu de [`supabase/functions/analyze-food/index.ts`](supabase/functions/analyze-food/index.ts)
5. Clique **Deploy**

### Alternative — CLI
```bash
npm i -g supabase
supabase login
supabase link --project-ref poarxjchlboobosgleaz
supabase functions deploy analyze-food
```

## 2. (déjà fait dans le code) verify_jwt

La fonction exige par défaut un utilisateur connecté (`verify_jwt = true`). L'app envoie
automatiquement le jeton de session. Rien à configurer.

## 3. Ajouter ta clé Claude en secret

Edge Functions → **Secrets** (ou Project Settings → Edge Functions → Secrets) :
https://supabase.com/dashboard/project/poarxjchlboobosgleaz/settings/functions

Ajoute :

| Nom | Valeur |
|-----|--------|
| `ANTHROPIC_API_KEY` | ta clé Anthropic (`sk-ant-...`) |
| `ANTHROPIC_MODEL` *(optionnel)* | `claude-opus-4-8` (défaut) ou `claude-haiku-4-5` pour réduire le coût |

Enregistre. La fonction lit la clé à l'exécution — elle n'est exposée nulle part.

## 4. Tester

Dans l'app : onglet **Scan** → **Photo** → prends une photo d'un plat. L'IA renvoie le
nom, la portion estimée et les macros. Ajuste les grammes si besoin, choisis le repas,
**Valide** → c'est ajouté à ton journal.

## Coût & modèle

- Chaque analyse = 1 appel Claude (vision). L'image est redimensionnée à ~1024 px côté
  navigateur pour limiter le coût.
- `claude-opus-4-8` (défaut) est le plus précis ; `claude-haiku-4-5` est nettement moins
  cher si tu veux réduire la facture — change `ANTHROPIC_MODEL` dans les secrets.

## Code-barres

L'onglet **Code-barres** interroge Open Food Facts (gratuit, sans clé) — aucune
configuration nécessaire. Saisis le numéro du code-barres pour récupérer le produit.
