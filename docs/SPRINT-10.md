# Sprint 10 : compte, confidentialité et modération

## Ce qui change
- **Connexion avec Google**, en plus de Facebook (et d'Apple sur iOS). La mention « En continuant, vous acceptez les conditions d'utilisation et la politique de confidentialité » est affichée sous la langue.
- **Visibilité d'un spot** à la création : « Moi uniquement » (par défaut) ou « Communauté Spot ».
  - Un spot privé n'apparaît que pour son créateur, sur la carte comme par un lien direct (la fiche répond « Ce spot n'existe plus »).
  - Les spots déjà enregistrés restent publics (migration 7), pour ne rien changer à ce que les gens voyaient.
- **Signaler ou bloquer** (menu ⋮ de la fiche d'un spot qui n'est pas le mien) :
  - signaler le spot avec une raison (lieu interdit ou dangereux, contenu inapproprié, spam, fausses informations, autre) ;
  - signaler un message : appui long sur le message (ou action d'accessibilité « Signaler ce message ») ;
  - bloquer le créateur : ses spots et ses messages disparaissent pour moi ; il n'est pas prévenu.
- **Compte et confidentialité** (nouvelle entrée du menu, route `/compte`) :
  - comptes de connexion (Facebook, Apple, Google) avec « Associer » ;
  - 4 réglages de notifications ;
  - visibilité proposée par défaut pour les nouveaux spots ;
  - utilisateurs bloqués, avec « Débloquer » ;
  - langue ;
  - **Supprimer mon compte** (`/compte/supprimer`) : choix « Tout supprimer » ou « Garder de façon anonyme » pour les spots publics et les messages, case « Je comprends… », puis retour à l'écran de connexion.

## Comment c'est organisé
```
features/moderation/
  domain/entities/Report.ts            Report, ReportReason, ReportTarget, BlockedUser
  domain/repositories/                 ReportRepository, BlockRepository
  domain/usecases/ReportContent.ts     raison obligatoire, précision pour « Autre », pas de doublon
  domain/usecases/BlockUser.ts         BlockUser, UnblockUser, GetBlockedUsers
  data/local/                          migration 8 (tables reports, user_blocks), dépôts SQLite
  presentation/ReportScreen.tsx        route /spot/[id]/signaler (?message=… pour un message)
features/account/
  domain/entities/AccountPreferences.ts  notifications + visibilité par défaut
  domain/repositories/AccountRepository.ts  comptes associés, suppression côté serveur
  domain/ports/AccountDataEraser.ts    effacer les données du téléphone
  domain/usecases/                     Get/UpdateAccountPreferences, Get/LinkProvider, DeleteAccount
  data/FakeAccountRepository.ts        compte SIMULÉ (comme FakeAuthRepository)
  data/KvAccountPreferencesRepository.ts  réglages dans le stockage clé-valeur
  data/local/SqliteAccountDataEraser.ts   effacement en une transaction
  presentation/                        AccountScreen, DeleteAccountScreen
features/spots/
  domain/entities/Spot.ts              SpotVisibility, isVisibleTo()
  domain/usecases/GetMapSpots.ts       masque les spots privés des autres et ceux des bloqués
  domain/usecases/GetSpotDetail.ts     spot privé = introuvable ; messages des bloqués masqués
  presentation/create/components/VisibilitySelector.tsx
```
- **Base SQLite : un seul compteur de version.** 1-4 et 7 pour les spots, 5 pour la prévision, 6 pour le quota gratuit, 8 pour la modération.

## Ce qui reste à brancher (pas de serveur pour l'instant)
- **Connexion Google réelle** : `FakeAuthRepository` répond toujours. Il faudra une bibliothèque de connexion Google (development build) et l'identifiant client OAuth, puis remplacer le dépôt dans `core/di/container.ts`.
- **Signalements** : gardés sur le téléphone (colonne `sent_at` prévue pour l'envoi). Ils doivent partir vers un serveur de modération pour que quelqu'un les traite.
- **Blocages** : locaux au téléphone ; côté serveur, il faudra aussi empêcher la personne bloquée de répondre.
- **Notifications** : les réglages sont enregistrés, mais l'envoi des notifications push n'existe pas encore (expo-notifications + serveur).
- **Suppression du compte** : `FakeAccountRepository.deleteAccount` simule l'appel serveur. Les fichiers photo restent dans le stockage de l'app (seules leurs références sont effacées).
- **Arrondi de la position des spots publics** sur la carte dézoomée (prévu dans la maquette) : pas encore fait.
- **Télécharger mes données** (maquette) : pas encore fait.

## Tests
- `moderation/domain/usecases/__tests__/` : ReportContent, BlockUser.
- `account/domain/usecases/__tests__/` : réglages, comptes associés, DeleteAccount (rien n'est effacé si le serveur échoue).
- `spots` : GetMapSpots (privés, bloqués), GetSpotDetail (spot privé, messages des bloqués), CreateSpot (visibilité), SqliteSpotRepository (colonne visibility).
