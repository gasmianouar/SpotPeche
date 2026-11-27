# Sprint 8 : le menu — Appâts et Mes prises

## Ce qui change à l'écran

| Écran | Changement |
|---|---|
| Menu latéral | **Appâts** · « Boutiques les plus proches · Google Maps » (avec une petite flèche : on quitte l'app). **Mes prises** · « Photos, lieux et dates » (remplace « Carnet de prises — bientôt »). |
| Appâts | Ouvre **Google Maps** sur la recherche « magasin articles de pêche ». Google Maps cherche autour de la position du téléphone et classe les boutiques de la plus proche à la plus loin, avec les horaires et l'itinéraire (maquette 2c). L'ancien écran provisoire « Bientôt ici… » est supprimé. |
| Mes prises (nouveau) | Grille de photos : chaque prise affiche sa date sur la photo et son lieu dessous. Filtres **Toutes · Cette année · Ce mois-ci**. Toucher une photo l'ouvre en grand avec le lieu, la date et l'heure, et un bouton **Voir le spot** (maquette 2d). |

## D'où viennent les prises ?
Une prise, c'est **une photo que j'ai publiée** :
- à la **création de mes spots** ;
- dans **mes messages**, sur n'importe quel spot.

Le **lieu** est le nom du spot, la **date** celle de la publication. Les plus récentes s'affichent d'abord. Une photo effacée du téléphone garde sa place, avec un pictogramme.

## Architecture

```
Menu ─► useDrawerViewModel ─► FindNearbyBaitShops ─► NearbyPlaceSearch (port) ◄── NativeExternalApps
                                                                                   comgooglemaps://?q=…  (iPhone)
                                                                                   sinon https://www.google.com/maps/search/?api=1&query=…

MyCatchesScreen ─► useMyCatchesViewModel ─► GetMyCatches ─► SpotRepository + MessageRepository.listByAuthor
                                           └► filterByPeriod (règle pure)
```

- **Nouvelle feature `catches`** : l'entité `Catch` (photo, lieu, coordonnées, date), la règle `filterByPeriod` et le cas d'usage `GetMyCatches`. Elle **dépend** de la feature `spots` (ses dépôts), jamais l'inverse.
- **Feature `baitShops`** : le domaine dit **quoi** chercher (`BAIT_SHOP_QUERY`). L'adaptateur `NativeExternalApps` sait **comment** ouvrir Google Maps (le D de SOLID).
- **Menu en données** : une nouvelle destination `nearbyBaitShops` et un `subtitle` facultatif dans `MENU_ITEMS`. Le composant n'a presque pas changé (le O de SOLID).
- **`MessageRepository.listByAuthor`** : nouvelle requête SQLite (`WHERE author_id = ?`). Aucune migration : la colonne existait déjà.
- **Rechargement** : « Mes prises » se recharge à chaque retour sur l'écran (`useFocusEffect`), donc une photo publiée entre-temps apparaît.

## Tests
- `GetMyCatches.test.ts` : photos de mes spots et de mes messages, ordre, identifiants uniques, spot disparu.
- `catchPeriods.test.ts` : Toutes, Cette année, Ce mois-ci.
- `catchFormat.test.ts` : dates courte et longue, nombre de prises.
- `FindNearbyBaitShops.test.ts` et `ExternalApps.test.ts` : recherche dans l'app Google Maps, sinon par le lien universel.
