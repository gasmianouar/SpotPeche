# Sprint 6 : les agents IA (activité des poissons, reconnaissance photo)

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
npx jest                                       # tous les tests
```

## Agent de reconnaissance des espèces
Quand on prend en photo un poisson (création d'un spot, ou « + Ajouter » sur la fiche), la photo est analysée par Claude, qui sait lire les images.
La reconnaissance des **appâts** a été retirée : on les choisit dans la liste illustrée.

```
RecognitionScreen ─► useRecognitionViewModel ─► RecognizeFromPhoto ─► ImageRecognizer (port)
                                                                        ├► AgentImageRecognizer ──► serveur /recognize ──► Claude
                                                                        └► DemoImageRecognizer (sans serveur, affichée « mode démo »)
```

**Fiabilité**
- L'app envoie son **catalogue des espèces** (identifiants et noms) avec la photo. Le schéma JSON imposé à Claude n'accepte **que ces identifiants** (liste `enum`) : il ne peut pas inventer d'espèce.
- **Consignes d'expert** : critères anatomiques et pièges classiques (perche ou sandre, brochet ou sandre, carpe ou carassin…).
- **Le droit de dire « je ne sais pas »** : photo floue, ou élément absent du catalogue → `recognized: false`. L'écran affiche alors la raison donnée par l'agent (« Photo trop floue », « Ressemble à une brème, absente du catalogue »).
- **Confiance calibrée** : 90 % et plus seulement si les critères sont bien visibles, et un total des confiances de 100 % au plus.
- **Double vérification** : le serveur puis l'app (`parseAgentReply`, puis le cas d'usage) écartent tout ce qui est hors catalogue, mal formé ou en double.
- **Pas de faux résultat** : si le serveur ne répond pas, l'écran le dit (« Reconnaissance indisponible… choisissez dans la liste ») au lieu de montrer la démo.

**Photo**
- Elle est prise un peu compressée (`quality: 0.5`) : l'envoi est plus rapide.
- Elle est lue en base64 avec `fetch` + `FileReader` (`FetchPhotoReader`), sans nouvelle librairie native.
- Limite : 5 Mo par image (limite de l'API Claude), vérifiée par l'app et par le serveur.

**Coût** : quelques centimes par photo. Si la même photo est renvoyée (nouvel essai), le serveur répond depuis son cache sans repayer.

**Sans serveur** (`EXPO_PUBLIC_SPOT_AI_URL` vide) : la démo reste branchée, et l'écran affiche clairement « Exemple (mode démo) ».

**Tests** : `RecognizeFromPhoto.test.ts`, `AgentImageRecognizer.test.ts` (envoi, photo trop lourde, panne, réponses mal formées) et, côté serveur, `recognize.test.ts` (validation, schéma limité au catalogue, consignes, lecture de la réponse).

## Application gratuite : la limite d'IA du jour
L'application est **gratuite**. Les deux agents IA appellent l'API Claude, qui est payante pour nous. Ils sont donc **limités chaque jour, par téléphone** (`FREE_DAILY_LIMITS` dans `features/freeQuota/domain/FreeQuota.ts`) :

| Fonction | Gratuit par jour | Au-delà |
|---|---|---|
| Analyse IA de l'activité des poissons | 5 | Estimation locale (gratuite), avec le message de la limite |
| Reconnaissance de l'espèce par photo | 5 | Message de la limite et bouton « Choisir dans la liste ». La photo n'est pas envoyée |

Le message annonce que l'usage illimité fera partie de la **version payante (bientôt disponible)**. Aucun paiement n'est encore en place.

- **Compteur** : table SQLite `ai_usage` (migration 6), une ligne par fonction et par jour. Il repart à zéro à minuit.
- **Seules les vraies analyses réussies sont décomptées.** Ni le cache, ni le repli local, ni une erreur ne consomment la limite.
- **Décorateurs** : `QuotaLimitedFishActivityAdvisor` et `QuotaLimitedImageRecognizer` enveloppent les agents sans les modifier (le O de SOLID).
- **Sans serveur IA**, rien n'est payant : l'algorithme local et la démo de reconnaissance (affichée comme telle) fonctionnent sans limite.
- **Limite du système** : le compteur est sur le téléphone. Réinstaller l'app le remet à zéro. Pour une vraie protection des coûts, il faudra un jour un compteur côté serveur (avec des comptes utilisateurs).
