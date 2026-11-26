# Agents IA de Spot : activité des poissons et reconnaissance photo

Petit serveur (Cloudflare Workers) qui fait travailler **Claude** pour l'app Spot. Il a deux routes :

| Route | Rôle |
|---|---|
| `POST /forecast` | À partir des conditions d'un spot : l'activité des poissons heure par heure et l'indice de pêche du jour. |
| `POST /recognize` | L'espèce de poisson visible sur une photo, choisie uniquement dans le catalogue de l'app. |

```
App Spot ──POST /forecast──►  ce serveur (garde la clé)  ──►  API Claude (claude-fable-5-2)
         ──POST /recognize─►
```

## Pourquoi un serveur ?
La clé de l'API Claude permet de dépenser de l'argent sur votre compte. Placée dans l'app, elle pourrait être extraite du téléphone par n'importe qui. Elle reste donc ici, comme **secret** du serveur.

## Mettre en ligne (une seule fois)
Il vous faut un compte **Cloudflare** (gratuit) et un compte **Claude Platform** avec une clé d'API (https://platform.claude.com).

Dans un terminal, depuis `D:\Workspaces\spot\server\fish-activity-agent` :

```bash
npm install                                # installe wrangler (l'outil Cloudflare)
npx wrangler login                         # ouvre le navigateur pour vous connecter à Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY  # collez votre clé Claude (elle n'est jamais écrite dans le code)
npx wrangler deploy                        # met le serveur en ligne et affiche son adresse
```

Puis, à la racine de l'app, créez un fichier **`.env.local`** (déjà ignoré par Git) :

```
EXPO_PUBLIC_SPOT_AI_URL=https://spot-fish-agent.<votre-compte>.workers.dev
```

Relancez l'app : l'écran Météo du spot affiche alors « Analyse IA · claude-fable-5-2 », et la reconnaissance photo n'est plus en mode démo. Sans cette adresse, ou si le serveur ne répond pas, l'app utilise son **algorithme local** et l'indique.

Pour tester sur votre machine avant de déployer : `npm run dev` (`wrangler dev`).

## Réglages (`wrangler.toml`)

| Réglage | Rôle | Par défaut |
|---|---|---|
| `MODEL` | Modèle Claude pour `/forecast` (et `/recognize` si `RECOGNITION_MODEL` est absent). | `claude-fable-5-2` |
| `RECOGNITION_MODEL` | Optionnel : un autre modèle pour la reconnaissance photo, par exemple `claude-sonnet-5-5`, moins cher. | la valeur de `MODEL` |
| `ANTHROPIC_API_KEY` | Secret, jamais dans le fichier : `npx wrangler secret put ANTHROPIC_API_KEY`. | (aucun) |

## `/forecast` : l'activité des poissons
- **Entrées** : coordonnées GPS du spot (arrondies à environ 10 m), météo heure par heure (1 à 48 heures : température, pression, vent, ciel), lever et coucher du soleil, phase de lune, espèces du spot, avis des pêcheurs (« ça mord ? » et « indice fiable ? »). Aucune donnée personnelle.
- **Raisonnement** (voir `SYSTEM_PROMPT` dans `src/agent.ts`) : saison et milieu déduits du GPS, lumière (aube, crépuscule), pression, vent, température, lune, comportement des espèces. Les avis des pêcheurs servent d'observation de terrain : beaucoup d'avis « pas fiable » font baisser sa confiance.
- **Sortie** : un JSON imposé par un schéma (*structured outputs*) : indice de 1 à 5, une phrase, 3 raisons, un score de 0 à 100 par heure, le meilleur créneau et un niveau de confiance. Le serveur revérifie tout, puis l'app aussi.
- **Cache** : 30 minutes, partagé entre tous les pêcheurs du même spot (à environ 100 m près), tant que la météo, les espèces et les avis n'ont pas changé.

## `/recognize` : la reconnaissance photo
> **N'est plus utilisé par l'app depuis le Sprint 7** : la reconnaissance se fait sur le téléphone, gratuitement et sans réseau (voir `docs/SPRINT-7.md`). L'endpoint reste disponible ; il peut être retiré.

- **Entrée** : `{ mediaType, data (photo en base64, 5 Mo max), catalog: [{ id, name, latinName? }] }` (espèces uniquement, 40 au plus).
- **Sortie** : `{ recognized, candidates: [{ id, confidence }] (3 au plus), note, model }`.
- Les identifiants possibles sont imposés par le schéma JSON (liste `enum` construite à partir du catalogue reçu) : Claude ne peut pas inventer d'espèce. Il peut répondre `recognized: false` (photo floue, poisson absent du catalogue), avec la raison dans `note`.
- **Cache** : une même photo renvoyée est servie depuis le cache pendant 24 h, sans repayer.

## Coûts (ordre de grandeur)
Avec `claude-fable-5-2` (8 $ par million de jetons en entrée, 40 $ en sortie) :
- **une analyse `/forecast`** : environ 2 000 mots en entrée et quelques milliers de jetons en sortie (réflexion comprise), soit **environ 0,10 à 0,20 $** ;
- **une reconnaissance photo** : quelques centimes.

Trois protections limitent la facture :
- **la limite gratuite de l'app** : 5 analyses et 5 reconnaissances par jour et par téléphone (`FREE_DAILY_LIMITS`). Elle est comptée sur le téléphone : réinstaller l'app la remet à zéro ;
- **le cache de l'app** : une analyse IA est réutilisée pendant 30 minutes ;
- **les caches du serveur** : 30 minutes pour `/forecast`, 24 h pour `/recognize`.

Pour diviser le coût par 2 ou par 4 : `MODEL = "claude-opus-5-5"` ou `"claude-sonnet-5-5"`.

## Sécurité : à prévoir avant une vraie mise en ligne publique
- L'en-tête `x-spot-client` filtre les appels au hasard, mais **ce n'est pas une authentification**. Quand la vraie connexion Facebook / Apple existera, le serveur devra vérifier le jeton de l'utilisateur, et pourra alors compter la limite gratuite lui-même.
- Ajoutez une **règle de limitation de débit** (Rate limiting) dans le tableau de bord Cloudflare, par exemple 30 requêtes par minute et par adresse IP.
- Fixez un **plafond de dépenses** sur votre compte Claude Platform.

## Réponses d'erreur

| Code | Cause |
|---|---|
| 403 | En-tête `x-spot-client` absent ou inconnu. |
| 404 / 405 | Autre route que `/forecast` ou `/recognize`, ou autre méthode que `POST`. |
| 400 | Requête invalide (champ manquant ou hors bornes). |
| 413 | Requête ou photo trop lourde. |
| 500 | Clé d'API absente : le secret n'a pas été posé. |
| 502 | L'API Claude a répondu une erreur, ou sa réponse a été refusée par la vérification. |

Dans tous ces cas, l'app se replie sur l'algorithme local, ou affiche « Reconnaissance indisponible ».

## Tests
`src/__tests__/agent.test.ts` (validation, consigne, schéma, lecture de la réponse, clé de cache) et `src/__tests__/recognize.test.ts` (validation, schéma limité au catalogue, consignes, lecture de la réponse) tournent avec le reste du projet :

```bash
npx jest                                        # à la racine du projet
npx tsc --noEmit -p server/fish-activity-agent  # types du serveur
```
