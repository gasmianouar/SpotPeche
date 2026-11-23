# Sprint 6 : l'agent IA de l'activité des poissons

## Ce qui a changé
L'écran **Météo du spot** (icône météo de la fiche) devient un écran dédié, compact, aux coordonnées GPS du spot :

| Bloc | Contenu |
|---|---|
| Conditions actuelles | Bandeau compact : icône, température, ressenti, vent, pression, humidité. |
| Heure par heure | Version serrée. |
| Indice de pêche | Note sur 5, une phrase et les raisons, **calculées par l'agent IA**. Dessous, « **Indice fiable ?** » : 👍 · 😐 · 👎 avec le nombre d'avis, un seul par personne. |
| Activité des poissons | Pour chaque heure : un emoji (🤩 ça mord bien, 😐 moyen, 😴 faible) et une barre, puis le **meilleur moment**. Une ligne dit qui a calculé : « Analyse IA · claude-fable-5-2 · confiance élevée », ou « Estimation locale ». |
| Lever / coucher, Lune | Comme avant. Pas de prévisions sur plusieurs jours. |

## Comment ça marche

```
Écran ─► useSpotWeatherViewModel ─► GetSpotFishingConditions ─► FishActivityAdvisor (port)
                                         │                          ▲
                                         │       ┌──────────────────┴──────────────────────────┐
                                         │       CachedFishActivityAdvisor (30 min)             │
                                         │         └► ResilientFishActivityAdvisor              │
                                         │              ├► RemoteAiFishActivityAdvisor ──► serveur ──► Claude
                                         │              └► LocalFishActivityAdvisor (repli) ──► algorithme local
                                         └► météo (Open-Meteo), lune, espèces, avis « ça mord ? » et « indice fiable ? »
```

1. **Affichage progressif** : l'estimation de l'algorithme local s'affiche **tout de suite**, avec « Analyse par l'agent IA en cours… ». Elle est remplacée quand l'agent répond (il réfléchit quelques secondes).
2. **L'agent IA** est sur un petit serveur (`server/fish-activity-agent`), qui seul garde la clé de l'API Claude. Il utilise **`claude-fable-5-2`**, le plus performant des modèles publics, avec une **réponse JSON imposée par un schéma** : il ne peut pas répondre autre chose qu'un indice, des raisons et un score par heure.
3. **Double vérification** : le serveur, puis l'app, revérifient tout (chaque heure doit être présente, nombres bornés, textes raccourcis). Une réponse douteuse est écartée au profit du calcul local.
4. **Repli automatique** : hors connexion, sans serveur ou en cas d'erreur, l'algorithme local répond, et l'écran l'indique.
5. **Les avis comptent** : « ça mord ? » (observation de terrain) et « indice fiable ? » sont envoyés à l'agent. Beaucoup d'avis « pas fiable » le rendent plus prudent : il baisse sa confiance.
6. **Coût maîtrisé** : un cache dans l'app (30 min) et un autre sur le serveur, partagé par tous les pêcheurs d'un même spot.

## L'algorithme local (`localFishActivityModel.ts`)
Fonction pure. Elle part d'un score de 45 sur 100, puis ajoute ou retire des points selon :
- **la lumière** : +30 autour de l'aube et du crépuscule (à 45 min près), +20 jusqu'à 1 h 30, −10 en pleine nuit ;
- **la pression sur 3 h** : baisse lente +10, stable +5, forte hausse −10, chute brutale −5 ;
- **le vent** : brise de 5 à 20 km/h +5, plus de 30 km/h −15, calme plat −3 ;
- **le ciel** : grand soleil de midi −10, couvert +5, pluie fine +5, neige −10 ;
- **la température** : coup de froid (−3 °C en 1 h) −5 ;
- **la lune** : nouvelle ou pleine lune +5 ;
- **les avis « ça mord ? »** du spot : de −5 à +5.

En cas d'**orage**, le score de l'heure est plafonné à 5 : pêche déconseillée. Seuils : 65 et plus = 🤩, de 40 à 64 = 😐, moins de 40 = 😴. L'indice sur 5 vaut la moyenne des 3 meilleures heures, divisée par 20.

## SOLID et patrons de conception
- **Port et adaptateurs (D de SOLID)** : le cas d'usage ne connaît que `FishActivityAdvisor`. IA ou calcul local, c'est le conteneur (`container.ts`) qui choisit.
- **Décorateurs (O de SOLID)** : le cache et le repli **enveloppent** l'agent sans le modifier. On peut en ajouter d'autres (journal, limite d'appels) sans toucher au reste.
- **Responsabilité unique (S)** : le contrat réseau et sa validation sont dans `aiForecastContract.ts`, le transport HTTP dans `RemoteAiFishActivityAdvisor`, et les règles de pêche dans l'algorithme local.

## Base de données : migration 5
Une table `forecast_reliability` pour les avis « Indice fiable ? », avec la clé primaire `(spot_id, user_id)` : un avis par personne.

## Activer l'agent IA
Il faut mettre le serveur en ligne une fois (compte Cloudflare gratuit et clé d'API Claude), puis donner son adresse à l'app dans `.env.local`. Toutes les étapes, les coûts et la sécurité sont expliqués dans **`server/fish-activity-agent/README.md`**. Tant que ce n'est pas fait, l'app fonctionne avec l'algorithme local.

## Tests
- **Algorithme local** : pics à l'aube et au crépuscule, soleil de midi, orage, baisse de pression, avis, confiance, meilleur créneau.
- **Contrat de l'IA** : requête minimale, validation et bornes, heure manquante refusée, créneau mal formé.
- **Client, repli, cache** : appel au bon endpoint, erreur serveur, repli local signalé, cache de 30 min, estimation locale non gardée.
- **Cas d'usage** : ce que reçoit l'agent, aperçu local puis analyse IA, avis de fiabilité.
- **Serveur** : validation, consigne et schéma imposés, lecture de la réponse, réponses coupées ou incomplètes refusées, clé de cache.

```bash
npx tsc --noEmit                               # types de l'app
npx tsc --noEmit -p server/fish-activity-agent # types du serveur
npx jest                                       # 96 tests
```
