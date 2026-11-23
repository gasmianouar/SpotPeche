# Sprint 5 : la fiche spot

## Ce qui a changé

| Fonction | Contenu |
|---|---|
| Ouvrir une fiche | Toucher un marqueur (vert ou rouge) sur la carte ouvre la **fiche du spot**. |
| Barre du haut | Retour, titre et une icône **météo** qui ouvre la météo **à l'endroit du spot** (pas celle de votre position). |
| Créateur | Avatar et nom repris du **profil Facebook** du créateur (initiales si pas de photo), date de création et badge d'activité (🤩 / 😐 / 😴). |
| Itinéraire | Ouvre l'appli de navigation du téléphone : Plans sur iOS, et sur Android le choix entre toutes les applis installées (Google Maps, Waze, OsmAnd…). |
| Partager | Feuille de partage du téléphone, avec les espèces et un lien **OpenStreetMap** (gratuit, pas de Google). |
| Espèces / Appâts | Les vignettes choisies à la création, puis **+ Ajouter une espèce** et **+ Ajouter un appât**. **Tout le monde** peut compléter un spot, mais **rien n'est jamais retiré** : ce qui existe est coché et verrouillé (« Déjà sur le spot »), on ne fait qu'ajouter. La reconnaissance par photo (agent IA) marche aussi depuis la fiche. |
| Messages façon Messenger | La description et les photos de la création sont le **premier message** (« créateur »). Sous chaque bulle : l'heure, **Réagir** (👍 ❤️ 😆 😮 🎣 🐟) et **Répondre**. Les réactions s'affichent en pastille dans le coin de la bulle, avec leur nombre. Une seule réaction par personne : un autre emoji la remplace, le même la retire. |
| Répondre | Affiche « Réponse à … » au-dessus de la saisie (✕ pour annuler) ; le message envoyé garde la citation. |
| Barre de saisie | 📷 prendre une photo, 🖼 galerie, champ « Aa », ➤ envoyer. Mes messages s'affichent à droite, en vert. |

## Mise à jour : « Ça mord ? », Prises / Appâts, météo du spot
- **Ça mord ?** : sous Itinéraire / Partager, trois pastilles 🤩 · 😐 · 😴 avec le nombre d'avis. Chacun donne **un seul avis** : en toucher une autre le change, retoucher la même le retire (cas d'usage `VoteActivity`). L'activité choisie à la création compte comme l'avis du créateur. Le badge d'activité à côté du nom a été retiré.
- **Prises · Appâts** : une seule carte compacte (« Prises » et « Appâts », avec leur nombre), une pastille **+ Ajouter** et une flèche **déplier / replier**. Repliée, la liste tient sur une ligne qui défile ; dépliée, toutes les vignettes s'affichent. L'état ouvert ou fermé est un simple état d'affichage : il reste dans la vue (`useState`), pas dans le ViewModel.
- **Météo du spot** : le sous-titre montre les coordonnées GPS du spot, et l'indice de pêche passe sous l'heure par heure.
- **À venir** : l'activité des poissons heure par heure, qui sera calculée par un agent IA.

Base de données, **migration 4** : table `spot_activity_votes`, avec la clé primaire `(spot_id, user_id)` (un avis par personne). Les spots existants reçoivent l'avis de leur créateur.

## Base de données : migration 3
- `spots` : deux colonnes, `owner_name` et `owner_photo` (le profil du créateur au moment de la création) ;
- `spot_messages` : les messages, avec la citation éventuelle (`reply_to_id`, `reply_author`, `reply_excerpt`) ;
- `message_reactions` : une ligne par **personne et par message**. La clé primaire `(message_id, user_id)` garantit la règle « une seule réaction par personne » directement dans SQLite.

Les spots d'exemple reçoivent un créateur, des espèces, des appâts et une description. Un petit échange de démo est ajouté sur « Ponton nord », avec réactions. Vos spots existants sont conservés.

## L'architecture

```
PRÉSENTATION                                   DOMAINE (TypeScript pur)                     DONNÉES
SpotDetailScreen ─► useSpotDetailViewModel ─► GetSpotDetail ───────────────────────────► SpotRepository      ◄─ SqliteSpotRepository
   CreatorCard, SpotItemsCard,                PostMessage ─────────────────────────────► MessageRepository   ◄─ SqliteMessageRepository
   MessageBubble, MessageComposer             ReactToMessage ──────────────────────────► ReactionRepository  ◄─ SqliteReactionRepository
CatalogPickerScreen ─► useSpotItemsPickerViewModel ─► AddSpotItems (ajoute, n'enlève jamais)
Services du téléphone (core/external) : DirectionsService (itinéraire) · ShareService (partage)
```

### Les règles métier (domaine, testées sans téléphone)
- **`GetSpotDetail`** fabrique la publication du créateur à partir de la description et des photos du spot. Elle n'est pas recopiée en base : son identifiant fixe (`s1#post`) permet d'y réagir et d'y répondre comme à un message normal. Il compte aussi les réactions et retrouve la mienne.
- **`AddSpotItems`** : la nouvelle liste vaut l'ancienne plus les nouveautés, sans doublon, et seulement ce qui existe au catalogue.
- **`PostMessage`** : refuse un message vide (ni texte ni photo) ou trop long (1 000 caractères), et 6 photos au maximum.
- **`ReactToMessage`** : poser, remplacer ou retirer sa réaction ; seuls les 6 emoji prévus sont acceptés.

### SOLID dans ce sprint
- **O (ouvert/fermé) et D (inversion des dépendances)** : l'écran de choix (`CatalogPickerScreen`) ne sait pas s'il sert à la création ou à la fiche. Il reçoit un `CatalogPickerVm` (une interface), fourni par deux ViewModels différents. De même, l'écran de reconnaissance reçoit `onAccept` : il coche dans le brouillon ou dans les ajouts au spot, sans le savoir.
- **I (ségrégation des interfaces)** : `MessageRepository` et `ReactionRepository` sont deux contrats séparés ; `DirectionsService` et `ShareService` aussi, même si une seule classe les implémente.
- **S (responsabilité unique)** : une bulle (`MessageBubble`) ne fait qu'afficher. Les réactions et les réponses remontent au ViewModel, qui appelle les cas d'usage.

### Navigation
```
src/app/spot/[id]/index.tsx          → /spot/s1 (la fiche ; [id] = segment dynamique)
src/app/spot/[id]/ajouter.tsx        → /spot/s1/ajouter?type=especes|appats
src/app/spot/[id]/reconnaissance.tsx → /spot/s1/reconnaissance?type=…
src/app/spot/[id]/meteo.tsx          → /spot/s1/meteo?lat=…&lon=…
```
La fiche se recharge à chaque fois qu'elle redevient visible (`useFocusEffect`), donc les espèces ajoutées apparaissent au retour.

## Pas de recompilation native
Ce sprint n'ajoute aucune librairie native : `Share` et `Linking` font partie de React Native. Il suffit de relancer l'app (tâche **BuildAndRunSprint3Android**) pour que la migration 3 s'applique.

## Tests ajoutés
`GetSpotDetail`, `AddSpotItems`, `PostMessage`, `ReactToMessage`, les liens et textes de partage, la citation d'un message, la conversion SQL des messages, la présence de la migration 3, les formats de date et les initiales.

```bash
npx tsc --noEmit
npx jest   # 70 tests
```

## Corrigé pendant le test sur l'émulateur
- **Toucher un marqueur ne faisait rien** : sur Android, MapLibre pose la vue du marqueur sur la carte, et un `Pressable` placé à l'intérieur ne reçoit pas le toucher. Le toucher passe maintenant par `onPress` du `Marker` lui-même.
- **Le clavier cachait la barre de saisie** : avec l'affichage bord à bord d'Android (activé par défaut dans Expo 58), l'écran ne rétrécit plus tout seul. `KeyboardAvoidingView` utilise donc `behavior="padding"` sur les deux plateformes, sur la fiche comme sur « Nouveau spot ».
- **Petits écrans** : les bulles rétrécissent au lieu de déborder, et les pastilles « Ajouter » passent à la ligne.

## À venir
Les messages et réactions sont pour l'instant **sur le téléphone** (SQLite). Pour que d'autres pêcheurs les voient, il faudra un serveur (même contrat `MessageRepository`, une autre implémentation : seule une ligne de `container.ts` changera).
