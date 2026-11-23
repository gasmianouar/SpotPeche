# Agent IA de Spot : activité des poissons

Petit serveur (Cloudflare Workers) qui reçoit les conditions d'un spot et demande à **Claude** d'estimer l'activité des poissons heure par heure, ainsi que l'indice de pêche du jour.

```
App Spot ──POST /forecast──► ce serveur (garde la clé) ──► API Claude (claude-fable-5-2)
```

## Pourquoi un serveur ?
La clé de l'API Claude permet de dépenser de l'argent sur votre compte. Une clé placée dans l'app pourrait être extraite du téléphone par n'importe qui. Elle reste donc ici, comme **secret** du serveur.

## Ce que fait l'agent
- **Entrées** : coordonnées GPS du spot (arrondies à environ 10 m), météo heure par heure (température, pression, vent, ciel), lever et coucher du soleil, phase de lune, espèces du spot, avis des pêcheurs (« ça mord ? » et « indice fiable ? »). Aucune donnée personnelle.
- **Raisonnement** (voir `SYSTEM_PROMPT` dans `src/agent.ts`) : saison et milieu déduits du GPS, lumière (aube, crépuscule), pression, vent, température, lune, comportement des espèces. Les avis des pêcheurs servent d'observation de terrain : beaucoup d'avis « pas fiable » font baisser sa confiance.
- **Sortie** : un JSON imposé par un schéma (*structured outputs*) : indice de 1 à 5, une phrase, 3 raisons, un score de 0 à 100 par heure, le meilleur créneau et un niveau de confiance. Le serveur revérifie tout, puis l'app aussi.
- **Modèle** : `claude-fable-5-2`, le plus performant des modèles publics de Claude pour un raisonnement exigeant. Il se change dans `wrangler.toml` (variable `MODEL`).

## Mettre en ligne (une seule fois)
Il vous faut un compte **Cloudflare** (gratuit) et un compte **Claude Platform** avec une clé d'API (https://platform.claude.com).

Dans un terminal, depuis `D:\Workspaces\spot\server\fish-activity-agent` :

```bash
npm install                                # installe wrangler (outil Cloudflare)
npx wrangler login                         # ouvre le navigateur pour vous connecter à Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY  # collez votre clé Claude (elle n'est jamais écrite dans le code)
npx wrangler deploy                        # met le serveur en ligne et affiche son adresse
```

Puis dans l'app, créez à la racine du projet un fichier **`.env.local`** (déjà ignoré par Git) :

```
EXPO_PUBLIC_SPOT_AI_URL=https://spot-fish-agent.<votre-compte>.workers.dev
```

Relancez l'app : l'écran Météo du spot affiche alors « Analyse IA · claude-fable-5-2 ». Sans cette adresse, ou si le serveur ne répond pas, l'app utilise son **algorithme local** et l'indique.

## Coûts (ordre de grandeur)
Une analyse représente environ 2 000 mots en entrée et quelques milliers en sortie (réflexion comprise). Avec `claude-fable-5-2` (8 $ / 40 $ par million de jetons), comptez **environ 0,10 à 0,20 $ par analyse**. Deux caches limitent la facture :
- **l'app** réutilise une analyse IA pendant 30 minutes ;
- **le serveur** la partage pendant 30 minutes entre tous les pêcheurs du même spot (à 100 m près).

Pour diviser le coût par 2 ou par 4 : `MODEL = "claude-opus-5-5"` ou `"claude-sonnet-5-5"`.

## Sécurité, à prévoir avant une vraie mise en ligne publique
- L'en-tête `x-spot-client` filtre les appels au hasard, mais **ce n'est pas une authentification**. Quand la vraie connexion Facebook / Apple existera, le serveur devra vérifier le jeton de l'utilisateur.
- Ajoutez une **règle de limitation de débit** (Rate limiting) dans le tableau de bord Cloudflare, par exemple 30 requêtes par minute et par adresse IP.
- Fixez un **plafond de dépenses** sur votre compte Claude Platform.

## Tests
Les fonctions de `src/agent.ts` (validation, consigne, lecture de la réponse, clé de cache) sont testées avec le reste du projet : `npx jest` à la racine.
