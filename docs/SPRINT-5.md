# Sprint 5 : la fiche spot

Toucher un marqueur (vert ou rouge) sur la carte ouvre la **fiche du spot** : qui l'a créé, comment y aller, ce qu'on y pêche, et une discussion façon Messenger.

## Ce qui a changé

| Bloc | Contenu |
|---|---|
| Barre du haut | Retour, titre et une icône **météo** qui ouvre la météo **à l'endroit du spot** (pas celle de votre position). L'écran lui-même est décrit dans le Sprint 6. |
| Créateur | Avatar et nom repris du **profil Facebook** du créateur (initiales si pas de photo) et date de création. |
| Itinéraire | Feuille « Itinéraire vers le spot » : **Google Maps** ou **Waze**, avec le trajet complet depuis la position actuelle. |
| Partager | Feuille « Partager la localisation » : aperçu du message, puis **WhatsApp**, **Messenger** ou **Autres**. |
| Ça mord ? | Trois pastilles 🤩 · 😐 · 😴 avec le nombre d'avis. Un seul avis par personne. |
| Prises · Appâts | Une carte compacte qui se déplie, avec **+ Ajouter**. Tout le monde peut compléter un spot, personne ne peut rien retirer. |
| Discussion | La description et les photos de la création forment le **premier message**. Réactions emoji, réponses citées, photos. |

## Le détail, bloc par bloc

### Itinéraire
La feuille propose deux applis. Pour chacune, l'app essaie d'abord le lien propre à l'appli, puis un lien web si l'appli n'est pas installée :

| Appli | Lien de l'appli | Repli |
|---|---|---|
| Google Maps | `comgooglemaps://?daddr=lat,lon` (iPhone) | `https://www.google.com/maps/dir/?api=1&destination=lat,lon` : ouvre l'appli sur Android, sinon le site |
| Waze | `waze://?ll=lat,lon&navigate=yes` | `https://waze.com/ul?…&navigate=yes` : la page Waze, qui propose d'installer l'appli |

### Partager
- L'aperçu montre le message envoyé : le créateur, les espèces, les coordonnées GPS, les liens d'itinéraire Google Maps et Waze, et un lien de carte **OpenStreetMap** (gratuit).
- **WhatsApp** reçoit le texte complet. Si l'appli manque : WhatsApp Web (`wa.me`).
- **Messenger** ne reçoit que le lien de carte, car il n'accepte pas de texte libre. Si l'appli manque : la feuille de partage du téléphone, avec un message d'explication.
- **Autres** ouvre la feuille de partage du téléphone (copier, SMS…).
- iOS : les schémas `comgooglemaps`, `waze`, `whatsapp` et `fb-messenger` sont déclarés dans `LSApplicationQueriesSchemes` (`app.json`).

### Ça mord ?
- Sous Itinéraire / Partager. Toucher une autre pastille change son avis, retoucher la même le retire (cas d'usage `VoteActivity`).
- L'activité choisie à la création compte comme l'avis du créateur.
- Le badge d'activité qui était à côté du nom du créateur a été retiré : les avis le remplacent.

### Prises · Appâts
- « Prises » et « Appâts », chacun avec son nombre, une pastille **+ Ajouter** et une flèche pour déplier ou replier.
- Repliée, la liste tient sur une ligne qui défile. Dépliée, toutes les vignettes s'affichent. L'état ouvert ou fermé ne concerne que l'affichage : il reste dans la vue (`useState`), pas dans le ViewModel.
- **+ Ajouter** ouvre l'écran de choix : ce qui est déjà sur le spot est coché et verrouillé (« Déjà sur le spot »), on ne peut qu'ajouter. La reconnaissance d'une espèce par photo marche aussi depuis la fiche.

### Discussion façon Messenger
- **Premier message** : la description et les photos de la création, marquées « créateur ».
- Sous chaque bulle : l'heure, **Réagir** (👍 ❤️ 😆 😮 🎣 🐟) et **Répondre**.
- **Réactions** : une pastille dans le coin de la bulle, avec leur nombre. Une seule réaction par personne : un autre emoji la remplace, le même la retire.
- **Répondre** affiche « Réponse à … » au-dessus de la saisie (✕ pour annuler). Le message envoyé garde la citation.
- **Barre de saisie** : 📷 prendre une photo, 🖼 galerie, champ « Aa », ➤ envoyer. Mes messages s'affichent à droite, en vert.

## Base de données

**Migration 3**
- `spots` : deux colonnes, `owner_name` et `owner_photo` (le profil du créateur au moment de la création) ;
- `spot_messages` : les messages, avec la citation éventuelle (`reply_to_id`, `reply_author`, `reply_excerpt`) ;
- `message_reactions` : une ligne par personne et par message. La clé primaire `(message_id, user_id)` garantit « une seule réaction par personne » directement dans SQLite.

**Migration 4**
- `spot_activity_votes` : les avis « Ça mord ? », clé primaire `(spot_id, user_id)` (un avis par personne). Les spots existants reçoivent l'avis de leur créateur.

Les spots d'exemple reçoivent un créateur, des espèces, des appâts et une description, et un petit échange de démo (avec réactions) est ajouté sur « Ponton nord ». Vos spots existants sont conservés.

## L'architecture

```
PRÉSENTATION                                         DOMAINE (TypeScript pur)              DONNÉES
SpotDetailScreen ─► useSpotDetailViewModel ─► GetSpotDetail ────────────────────► SpotRepository          ◄─ SqliteSpotRepository
   CreatorCard, ActivityVoteBar,              PostMessage ──────────────────────► MessageRepository       ◄─ SqliteMessageRepository
   SpotItemsCard, MessageBubble,              ReactToMessage ───────────────────► ReactionRepository      ◄─ SqliteReactionRepository
   MessageComposer,                           VoteActivity ─────────────────────► ActivityVoteRepository  ◄─ SqliteActivityVoteRepository
   DirectionsSheet, ShareLocationSheet
CatalogPickerScreen ─► useSpotItemsPickerViewModel ─► AddSpotItems (ajoute, n'enlève jamais)
Services du téléphone (core/external) : DirectionsService · ShareService ◄─ NativeExternalApps
```

### Les règles métier (domaine, testées sans téléphone)
- **`GetSpotDetail`** fabrique le message du créateur à partir de la description et des photos du spot. Il n'est pas recopié en base : son identifiant fixe (`s1#post`) permet d'y réagir et d'y répondre comme à un message normal. Il compte aussi les réactions et les avis « Ça mord ? », et retrouve les miens.
- **`AddSpotItems`** : la nouvelle liste vaut l'ancienne plus les nouveautés, sans doublon, et seulement ce qui existe au catalogue.
- **`PostMessage`** refuse un message vide (ni texte ni photo) ou trop long (1 000 caractères), et plus de 6 photos.
- **`ReactToMessage`** : poser, remplacer ou retirer sa réaction. Seuls les 6 emoji prévus sont acceptés.
- **`VoteActivity`** : poser, changer ou retirer son avis « Ça mord ? ».

### SOLID dans ce sprint
- **O (ouvert/fermé) et D (inversion des dépendances)** : l'écran de choix (`CatalogPickerScreen`) ne sait pas s'il sert à la création ou à la fiche. Il reçoit un `CatalogPickerVm` (une interface), fourni par deux ViewModels différents. De même, l'écran de reconnaissance reçoit `onAccept` : il coche dans le brouillon ou dans les ajouts au spot, sans savoir lequel.
- **I (ségrégation des interfaces)** : `MessageRepository` et `ReactionRepository` sont deux contrats séparés, `DirectionsService` et `ShareService` aussi, même si une seule classe (`NativeExternalApps`) les implémente.
- **S (responsabilité unique)** : une bulle (`MessageBubble`) ne fait qu'afficher. Les réactions et les réponses remontent au ViewModel, qui appelle les cas d'usage.
- **Testable sans téléphone** : `NativeExternalApps` reçoit les fonctions du téléphone par son constructeur (`PhoneLinks`). Les tests lui donnent un faux téléphone (`ExternalApps.test.ts`).

### Navigation
```
src/app/spot/[id]/index.tsx          → /spot/s1 (la fiche ; [id] = segment dynamique)
src/app/spot/[id]/ajouter.tsx        → /spot/s1/ajouter?type=especes|appats
src/app/spot/[id]/reconnaissance.tsx → /spot/s1/reconnaissance?type=…
src/app/spot/[id]/meteo.tsx          → /spot/s1/meteo?lat=…&lon=…
```
La fiche se recharge chaque fois qu'elle redevient visible (`useFocusEffect`) : les espèces ajoutées apparaissent au retour.

## Pas de recompilation native
Ce sprint n'ajoute aucune librairie native : `Share` et `Linking` font partie de React Native. Il suffit de relancer l'app (tâche **BuildAndRunSprint3Android**) pour que les migrations 3 et 4 s'appliquent.

## Tests ajoutés
`GetSpotDetail`, `AddSpotItems`, `PostMessage`, `ReactToMessage`, `VoteActivity`, les liens et le texte de partage (`spotLinks`), l'ouverture des applis et leurs replis (`ExternalApps`), la citation d'un message, la conversion SQL des messages, la présence des migrations, les formats de date et les initiales.

```bash
npx tsc --noEmit
npx jest
```

## Corrigé pendant le test sur l'émulateur
- **Toucher un marqueur ne faisait rien** : sur Android, MapLibre pose la vue du marqueur sur la carte, et un `Pressable` placé à l'intérieur ne reçoit pas le toucher. Le toucher passe maintenant par `onPress` du `Marker` lui-même.
- **Le clavier cachait la barre de saisie** : avec l'affichage bord à bord d'Android (activé par défaut dans Expo 58), l'écran ne rétrécit plus tout seul. `KeyboardAvoidingView` utilise donc `behavior="padding"` sur les deux plateformes, sur la fiche comme sur « Nouveau spot ».
- **Petits écrans** : les bulles rétrécissent au lieu de déborder, et les pastilles « Ajouter » passent à la ligne.

## À venir
- **Messages partagés** : les messages, réactions et avis sont pour l'instant **sur le téléphone** (SQLite). Pour que les autres pêcheurs les voient, il faudra un serveur. Ce sera le même contrat (`MessageRepository`…) avec une autre implémentation : seul `container.ts` changera.
- **Activité des poissons heure par heure**, calculée par un agent IA : fait au Sprint 6.
