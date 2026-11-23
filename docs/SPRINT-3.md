# Sprint 3 — Menu simplifié, Mes spots hors connexion, déconnexion

## Ce qui a changé

| Fonction | Contenu |
|---|---|
| Menu latéral | Il ne reste que **Carte des spots**, **Mes spots**, **Appâts**, **Carnet de prises** et **Se déconnecter**. Favoris, Météo, Paramètres et Aide & réglementation ont été retirés. Le bouton de déconnexion est fixé en bas du menu. |
| Mes spots | Les spots sont enregistrés dans une **base SQLite sur le téléphone** : ils s'affichent même sans réseau. Toucher « Mes spots » affiche la carte avec **uniquement mes spots** (en vert), une pastille « Mes spots (3) ✕ » pour revenir à tous les spots, et une légende réduite. |
| Se déconnecter | Une confirmation, puis la déconnexion : le menu se ferme, la session est vidée et l'app revient à l'écran de connexion. Si le fournisseur (Facebook / Apple) ne répond pas, on déconnecte quand même localement. Les spots restent sur le téléphone. |

## ⚠️ Nouvelle librairie native : il faut recompiler une fois
`expo-sqlite` contient du code natif. Après `npm install`, relance une fois :
```bash
npx expo run:android
```
Ensuite, `npx expo start` suffit à nouveau.

## La base de données locale, expliquée

```
HomeScreen ─► useHomeViewModel ─► GetMapSpots(filter) ─► SpotRepository (interface)
                                                               ▲
                                              SqliteSpotRepository (data/local)
                                                               │
                                              createDatabaseProvider("spot.db", migrations)
```

- **SQLite** est une vraie base de données SQL, stockée dans un fichier sur le téléphone (`spot.db`). Pas de serveur, donc ça fonctionne hors connexion.
- **`createDatabaseProvider`** (`core/database/openDatabase.ts`) ouvre la base **une seule fois**, au premier besoin, puis la réutilise. Il active le mode WAL, recommandé pour les performances, et joue les migrations.
- **Migrations** (`core/database/migrations.ts`) : SQLite garde un numéro de version (`PRAGMA user_version`). Au démarrage, on joue uniquement les migrations plus récentes que ce numéro, chacune dans une transaction (tout ou rien). Règle d'or : on ne modifie jamais une migration déjà livrée, on en ajoute une nouvelle.
- **`SPOT_MIGRATIONS`** (`features/spots/data/local/spotMigrations.ts`), version 1 :
  - crée la table `spots` et un **index** sur `owner_id`, pour que « mes spots » soit rapide ;
  - insère les spots d'exemple, en attendant l'écran de création.
- **Requêtes paramétrées :** `WHERE owner_id = ?`. La valeur est passée à part et jamais collée dans le texte SQL. Cela protège des injections SQL.
- **`rowToSpot`** traduit une ligne SQL (`owner_id`, `latitude`…) en entité du domaine (`ownerId`, `coordinates`). C'est le même principe que le mapper Open-Meteo.
- **Clean Architecture en action :** on est passé de `InMemorySpotRepository` à `SqliteSpotRepository` en changeant **une ligne** dans `container.ts`. Le cas d'usage, le ViewModel et l'écran n'ont pas bougé pour ça. `InMemorySpotRepository` sert maintenant aux tests.

## Le filtre « Mes spots » passe par l'URL

Le menu ouvre `/?filter=mine`. Le ViewModel de l'accueil lit ce paramètre (`useLocalSearchParams`) et le passe au cas d'usage : `getMapSpots.execute(userId, 'mine')`. Avantages :
- un seul écran de carte pour les deux usages ;
- le paramètre fait partie de l'adresse, ce qui permettra plus tard d'ouvrir l'app directement sur « Mes spots » depuis un lien ;
- le menu sait quelle entrée surligner en lisant ce même paramètre (`useGlobalSearchParams`).

## Tests (`npm test` : 27 tests)
- `GetMapSpots.test.ts` : le filtre `mine` ne renvoie que mes spots ; sans utilisateur connecté, il ne renvoie rien.
- `migrations.test.ts` : base neuve, toutes les migrations sont jouées dans l'ordre ; base existante, celles déjà jouées ne sont pas rejouées.
- `SqliteSpotRepository.test.ts` : conversion d'une ligne SQL en `Spot`.

## À tester sur le téléphone
1. Menu : vérifier les 4 entrées et le bouton de déconnexion en bas.
2. Menu → Mes spots : seuls les 3 spots verts restent. La pastille ✕ réaffiche tout.
3. Mode avion, puis relancer l'app : les spots s'affichent toujours. La carte de fond peut rester grise, car les tuiles OpenFreeMap viennent d'internet.
4. Menu → Se déconnecter → confirmer : retour à l'écran de connexion. Se reconnecter : les spots sont toujours là.

## Correctif : marqueurs invisibles après un passage par l'onglet Météo

**Symptôme :** après Accueil → Météo → Accueil, les épingles ne s'affichaient plus.

**Cause :** chaque épingle est un `<Marker>`, c'est-à-dire une vraie vue Android posée sur la carte. Quand on quitte un onglet, son écran est mis en veille. Au retour, MapLibre ne raccrochait pas ces vues à la carte.

**Correction retenue** (vérifiée sur l'émulateur) :
- `HomeScreen.tsx` utilise `useIsFocused()` d'Expo Router : la carte n'est affichée que lorsque l'onglet Accueil est au premier plan. Au retour depuis Météo, elle est donc **recréée**, marqueurs compris.
- Pour que l'utilisateur ne perde pas sa position, la carte signale chaque déplacement (`onRegionDidChange`). `HomeScreen` mémorise la dernière caméra dans un `useRef`, et la nouvelle carte repart de là (`initialCamera`).
- Les épingles utilisent maintenant de vraies images (`assets/map/pin-*.png`, en 1x, 2x et 3x) : vert avec une étoile pour mes spots, rouge avec un rond pour la communauté.

**Piste abandonnée :** dessiner les épingles par le moteur de la carte (`GeoJSONSource` et `Layer`). Sur l'émulateur, ces couches n'affichaient rien, et les erreurs natives de MapLibre ne remontent pas dans Metro. À réessayer plus tard, journal Android (logcat) à l'appui, si on a beaucoup de spots ou besoin de regroupement.

**Nouvelle notion : `useRef` ou `useState` ?** `useState` redessine l'écran à chaque changement. `useRef` garde une valeur sans redessiner. La position de la caméra change à chaque glissement de doigt : la mettre dans un état provoquerait des rendus inutiles.
