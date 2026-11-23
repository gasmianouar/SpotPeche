# Sprint 4 : création d'un spot

## Ce qui a changé

| Fonction | Contenu |
|---|---|
| Bouton « + » de l'accueil | Ouvre l'écran **Nouveau spot**. |
| Emplacement | Une mini-carte avec une épingle fixe au centre. **Dès l'ouverture de l'écran**, l'app lit automatiquement les **coordonnées GPS exactes** (précision maximale, 6 décimales, environ 10 cm) et affiche la marge d'erreur du GPS (« ±5 m »). On peut ensuite ajuster en déplaçant la carte. |
| Espèces présentes | Les espèces choisies apparaissent en vignettes. La case **Choisir** ouvre un écran de photos à cocher, avec une recherche, un bouton **Reconnaître l'espèce** et un bouton **OK**. |
| Appâts utilisés | Même principe, avec le même écran : choix des appâts et bouton **Reconnaître l'appât**. |
| Reconnaissance IA | Une photo de la prise ou du leurre. L'agent IA propose jusqu'à 3 résultats avec un pourcentage de confiance, et **Ajouter** coche la proposition. *Pour l'instant, c'est un agent de démonstration avec des réponses fixes* (voir plus bas). |
| Activité des poissons | 🤩 Ça mord bien · 😐 Moyen · 😴 Nul (un seul choix). |
| Commentaire et photos | Zone de commentaire façon Messenger (500 caractères, compteur). Sa barre d'outils a une icône **appareil photo** (prendre une photo et la joindre) et une icône **galerie**. Les photos jointes s'affichent en miniatures dans le commentaire, avec un ✕ pour les retirer (6 au maximum). |
| Enregistrer le spot | Le spot est enregistré dans SQLite, puis l'app **revient à l'accueil**. La carte se recentre sur le nouveau **marqueur vert**, et le bandeau « Spot enregistré · ajouté à Mes spots » s'affiche pendant 4 secondes. |

Les champs **nom du spot**, **type d'eau** et **spot privé** ont été supprimés, comme dans la maquette. Un nom lisible est fabriqué automatiquement, par exemple « Spot à brochet du 23/11 ».

## ⚠️ Nouvelle librairie native : il faut recompiler une fois
`expo-image-picker` (appareil photo et galerie) contient du code natif. Il faut donc :
1. lancer `npm install` ;
2. lancer la tâche VS Code **BuildAndRunSprint3Android** (elle fait `expo run:android`).

La base SQLite passe aussi de la version 1 à la **version 2** grâce à une nouvelle migration. Les spots déjà enregistrés sont conservés.

## L'architecture, couche par couche

```
                 PRÉSENTATION (React)                          DOMAINE (TypeScript pur)               DONNÉES
CreateSpotScreen ─► useCreateSpotViewModel ──────────────► CreateSpot ───────────────────► SpotRepository ◄─ SqliteSpotRepository
CatalogPickerScreen ─► useCatalogPickerViewModel              (valide, nomme, enregistre)
RecognitionScreen ─► useRecognitionViewModel ────────────► RecognizeFromPhoto ──────────► ImageRecognizer ◄─ DemoImageRecognizer
        │                                                   (filtre, trie, top 3)
        └── spotDraftStore (Zustand) : le brouillon partagé entre les écrans
Services du téléphone (core/) : PreciseLocationService (GPS) · PhotoService (caméra, galerie) · IdGenerator
```

### Domaine : les règles métier, sans téléphone
- **`CreateSpot`** : refuse un spot sans position ou avec des coordonnées impossibles, ainsi qu'une description trop longue. Il lance alors une `SpotValidationError` qui indique **quel champ** corriger. Il ne garde que les espèces et appâts connus du catalogue, sans doublon, puis fabrique l'entité complète (id, propriétaire, nom, date) et l'enregistre.
- **`RecognizeFromPhoto`** : quelle que soit l'IA utilisée, il écarte ce qui n'est pas dans le catalogue, borne la confiance entre 0 et 1, trie les résultats et garde les 3 meilleurs.
- **`Catalog`** : la liste des espèces et des appâts. Le domaine ne connaît que des **identifiants**. Ce sont les images, côté présentation (`catalogImages.ts`), qui associent une photo à chaque identifiant.

### SOLID dans ce sprint
- **S (responsabilité unique)** : chaque écran a sa vue (affichage) et son ViewModel (logique). Le cas d'usage ne fait que la règle métier.
- **O (ouvert/fermé)** : pour brancher une vraie IA, on écrit une nouvelle classe `ImageRecognizer` et on change **une ligne** dans `core/di/container.ts`. Aucun écran ni cas d'usage ne change.
- **L (substitution de Liskov)** : `InMemorySpotRepository` (tests) et `SqliteSpotRepository` (app) sont interchangeables.
- **I (ségrégation des interfaces)** : `LocationService` (position rapide pour la météo) et `PreciseLocationService` (GPS exact pour un spot) sont deux interfaces distinctes. L'écran météo n'a pas besoin du GPS exact.
- **D (inversion des dépendances)** : les cas d'usage dépendent d'**interfaces** (`SpotRepository`, `ImageRecognizer`, `IdGenerator`), jamais d'Expo ou de SQLite. C'est pour ça qu'on peut les tester sans téléphone.

### Le GPS « exact »
`ExpoLocationService.getPrecisePosition()` utilise `Location.Accuracy.BestForNavigation`, la précision la plus haute (GPS et capteurs). Il renvoie aussi `accuracyMeters`, la marge d'erreur annoncée par le téléphone. Une position GPS a **toujours** une marge d'erreur : la plus honnête des choses est de l'afficher. La recherche démarre **automatiquement** à l'ouverture de l'écran (un `useEffect` lancé une seule fois, pas de bouton). Quand la position arrive, la carte s'y rend (`flyTo`). Si l'utilisateur a déjà placé le spot à la main pendant la recherche, son choix est gardé. Si l'utilisateur déplace ensuite la carte **à la main** (`userInteraction` de `onRegionDidChange`), le centre de la carte devient la nouvelle position. Les déplacements faits par le code n'écrasent jamais la position GPS.

**Si la position n'arrive pas.** `LocationUnavailableError` indique la raison (`servicesDisabled` ou `noSignal`), et l'écran affiche le message adapté au lieu de planter. Sur Android, si la localisation est coupée, `getCurrentPositionAsync` propose d'abord, de lui-même, la fenêtre système « Activer la localisation ? ».

> ⚠️ **Émulateur sans Google Play.** L'émulateur `Spot_API_34` est une image Android « nue », sans Google Play Services. Or expo-location s'appuie sur le service de localisation de Google : la position automatique ne peut pas y fonctionner (le message « localisation désactivée » s'affiche). Sur un vrai téléphone, ou sur un émulateur créé avec une image **« Google Play »**, ça fonctionne. Pour tester sur l'émulateur actuel, placez le spot en déplaçant la carte.

### Le brouillon partagé (`spotDraftStore`)
Le parcours s'étale sur quatre écrans. Plutôt que de faire passer les sélections dans l'URL, ils partagent un petit **store Zustand** :
- l'écran de choix coche et décoche directement dans le brouillon ;
- l'écran IA y **ajoute** sa proposition ;
- le formulaire relit tout.

Le brouillon est vidé après l'enregistrement ou quand on quitte avec la flèche retour.

### Navigation (Expo Router)
```
src/app/nouveau-spot/_layout.tsx        → une pile d'écrans dédiée
src/app/nouveau-spot/index.tsx          → /nouveau-spot (formulaire)
src/app/nouveau-spot/especes.tsx        → /nouveau-spot/especes
src/app/nouveau-spot/appats.tsx         → /nouveau-spot/appats
src/app/nouveau-spot/reconnaissance.tsx → /nouveau-spot/reconnaissance?type=especes|appats
```
Après l'enregistrement, `router.dismissTo({ pathname: '/', params: { savedSpotId, lat, lon } })` ferme toute la pile du parcours et revient à l'accueil avec ces paramètres. L'accueil recharge ses spots chaque fois qu'il redevient visible (`useFocusEffect`), ce qui fait apparaître le nouveau marqueur. Il affiche aussi le bandeau, centre la carte, puis efface les paramètres au bout de 4 secondes.

### L'agent IA : pourquoi une démo pour l'instant ?
Un vrai agent de reconnaissance (Claude, ou un modèle de vision) demande une **clé d'API**. Une clé placée dans l'app pourrait être extraite par n'importe qui. La bonne architecture est donc :
```
App ──photo──► ton serveur (garde la clé) ──► API de l'IA
```
`DemoImageRecognizer` attend 1,2 s puis répond « Brochet 92 % » ou « Shad 88 % ». Le jour où le serveur existe, on écrit `RemoteImageRecognizer implements ImageRecognizer` et on le branche dans le conteneur.

## Tests ajoutés
- `CreateSpot` : enregistrement complet, position manquante ou impossible, description trop longue, identifiants inconnus et doublons, nom automatique.
- `RecognizeFromPhoto` : tri, filtrage par catalogue, confiance bornée, 3 résultats au maximum.
- `Catalog` : identifiants uniques, chaque élément a une image.
- `rowToSpot` / `spotToParams` : conversion SQL ↔ entité, y compris les listes JSON et les valeurs abîmées.

```bash
npx tsc --noEmit   # types
npx jest           # 43 tests
```
