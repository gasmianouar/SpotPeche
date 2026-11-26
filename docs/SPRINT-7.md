# Sprint 7 : la reconnaissance des espèces sur le téléphone

La reconnaissance photo ne passe plus par l'agent IA du serveur : **deux petits modèles embarqués dans l'app** font tout sur le téléphone.
- **0 $** : aucun appel à une API payante, donc plus de limite de 5 photos par jour ;
- **sans réseau** : ça marche en mer, en mode avion ;
- **privé** : la photo ne quitte jamais le téléphone.

Le catalogue est recentré sur la **mer** (52 espèces marines, 8 d'eau douce gardées).
Conception : `docs/superpowers/specs/2026-11-24-reconnaissance-embarquee-design.md` · plan : `docs/superpowers/plans/2026-11-24-reconnaissance-embarquee.md`.

## Ce qui change à l'écran

| Écran | Changement |
|---|---|
| Reconnaissance photo | « Analysé sur le téléphone ». Jusqu'à 3 propositions avec leur confiance. Sans poisson visible : « Aucun poisson repéré sur la photo ». En cas de doute, une note invite à vérifier dans la liste. |
| Choix des espèces | Filtre **Mer · Eau douce · Tout** (Mer par défaut). Une recherche tapée cherche dans tout le catalogue, noms des espèces regroupées compris. |
| Illustrations | Chaque espèce sans dessin propre affiche la **silhouette de sa famille** (12 familles : bars, sparidés, mulets, maquereaux, gadidés, labres, poissons plats, anguilles, rascasses, céphalopodes, requins, autres). |
| Menu | Petit lien **Composants open source** tout en bas : les mentions MIT et Apache 2.0 des modèles. |
| Limite gratuite | Ne concerne plus que l'analyse IA de l'activité des poissons. |

## Parcours d'une photo

```
RecognitionScreen ─► useRecognitionViewModel ─► RecognizeFromPhoto ─► ImageRecognizer (port)
                                                                        └► OnDeviceImageRecognizer
   1. ExpoPhotoPixelsReader     photo réduite à 640 px max, décodée en RGB (jpeg-js)
   2. ExecutorchFishDetector    fish-detector.pte (RF-DETR Nano, photo étirée en 384×384) → boîte du poisson principal :
                                la plus grande parmi celles dont le score atteint 60 % du meilleur (seuil 0,3)
   3. cropToBox                 recadrage au ras de la boîte
   4. ExecutorchSpeciesEmbedder species-embedder.pte (ConvNeXt Tiny de Fishial, 224×224) → empreinte de 256 valeurs
   5. scoreSpecies              couche de décision species-head.json → 3 espèces du catalogue au plus
```

- **Couche de décision** (`species-head.json`, 130 Ko) : une régression logistique apprise sur des photos iNaturalist, 65 classes pour les 60 entrées du catalogue. Elle ne peut proposer **que des espèces du catalogue**.
- **Jumeaux regroupés** : les espèces impossibles à distinguer sur photo forment une seule entrée, et leurs probabilités s'additionnent (`mulet` = 4 mulets, `lieu` = lieu jaune et lieu noir, `chinchard`).
- **Prudence** : en dessous de 10 % de confiance, une proposition n'est pas affichée (`DEFAULT_SCORE_OPTIONS`).
- **Modèles chargés une seule fois**, au premier usage, et réessayés si le chargement échoue. Toute panne donne « Reconnaissance indisponible, choisissez dans la liste », jamais un faux résultat.
- **Moteur** : ExecuTorch (`react-native-executorch` 0.11.1, backend XNNPACK). Le redimensionnement reproduit celui de Pillow, pour que l'app voie exactement ce qu'ont vu les contrôles de précision.

## Précision mesurée (hors app)

`scripts/ml/app_accuracy.py`, photos de test jamais vues à l'apprentissage, même pipeline que l'app :

| Mesure | Résultat |
|---|---|
| Bonne espèce en 1re proposition | **70,9 %** (72,6 % avec l'ancien détecteur YOLO) |
| Bonne espèce dans les 3 propositions | **82,8 %** (85,5 % avec YOLO ; objectif 85 %) |
| Classements de l'app (TypeScript) et du script (Python) | identiques sur 50/50 photos |

## Taille de l'app

| Élément | Poids |
|---|---|
| `fish-detector.pte` (RF-DETR Nano, int8 dynamique) | 39,6 Mo |
| `species-embedder.pte` (int8 dynamique) | 35,2 Mo |
| `species-head.json` + silhouettes | < 1 Mo |
| Bibliothèques natives ExecuTorch (arm64) | ≈ 12,5 Mo |
| **Ajout total estimé** | **≈ 88 Mo** (budget 85 Mo : dépassé de 3 Mo) |

Publication en **AAB** : le Play Store ne livre que l'architecture du téléphone. La taille réelle se mesure avec `scripts\measure-apk.cmd` (résultat dans `.tmp\apk-sizes.txt`).

## Ajouter ou modifier une espèce
1. L'ajouter dans `src/features/spots/domain/entities/Catalog.ts` (`habitat`, `family`, `latinName`, éventuellement `members`).
2. `npx tsx scripts/ml/dump-catalog.ts > .tmp/ml/catalog.json`.
3. Ajouter ses photos (iNaturalist, licences CC) à un jeu de photos JSON, au format décrit dans `scripts/ml/photo_sets.py` (`split` : `ref` pour apprendre, `test` pour contrôler), puis réapprendre la couche de décision :
   `python scripts\ml\train_head.py --catalog .tmp\ml\catalog.json --photos <jeux de photos> --out assets\models\species-head.json`
4. Contrôler : `python scripts\ml\app_accuracy.py --catalog .tmp\ml\catalog.json --photos <jeux de test>` (seuils : 70 % en 1re proposition, 85 % dans les 3).

Les deux `.pte` ne changent pas : seule la couche de décision est réapprise, en quelques minutes.

## Mise en route sur le PC (Windows)
- **Tout reste sur D:** (règle `AGENTS.md`), y compris le cache des bibliothèques natives (`RNET_LIBS_CACHE_DIR=D:\Android\rnet-cache`).
- `.\scripts\setup-recognition.cmd` : installe les dépendances, télécharge les bibliothèques natives d'ExecuTorch (le postinstall est bloqué par npm), puis lance `tsc` et `jest`.
- `.\scripts\sprint7-tout.cmd` : préparation, mesure de la taille, puis lancement sur l'émulateur. Journaux dans `.tmp\`.
- **Recompilation native obligatoire** (nouvelles bibliothèques natives) : Expo Go ne suffit plus.
- La compilation de production exige les chemins longs de Windows (`LongPathsEnabled = 1`, puis redémarrage).
- Ne jamais lancer `npx expo install --fix` : il casserait les `overrides` de `react-native-worklets` et `react-native-reanimated`.

## Tests
- **Domaine** : `scoreSpecies.test.ts` (groupes, seuil, 3 propositions), `RgbImage.test.ts` (boîte, recadrage), `Catalog.test.ts`.
- **Données** : `OnDeviceImageRecognizer.test.ts` (aucun poisson, panne, chargement paresseux), `preprocess.test.ts` (redimensionnement comparé à Pillow), `executorchAdapters.test.ts`, `PhotoPixelsReader.test.ts`.
- **Présentation** : `catalogImages.test.ts`, `filterCatalog.test.ts`, `about.test.ts`.

```bash
npx tsc --noEmit
npx jest
```

## Reste à valider sur un vrai téléphone
- Temps de réponse (< 1 s visé), mémoire, photos en portrait (EXIF), photo de 12 Mpx, photo avec deux poissons.
- Taille réelle de l'AAB.
- **Précision et taille** : le passage à RF-DETR (26/11) coûte 2,7 points en top 3 (82,8 % au lieu de 85 % visés) et
  14,6 Mo. Pistes : affiner RF-DETR sur des photos de prises, ajouter des photos de référence.

## Licences (26/11)
Le détecteur YOLO26 de Fishial (entraîné avec Ultralytics, AGPL-3.0) a été remplacé par le **Community Fish Detector
RF-DETR Nano (Apache 2.0)**. L'app ne contient plus aucun composant AGPL. Les licences MIT (classifieur Fishial,
react-native-executorch), Apache 2.0 (détecteur) et BSD (ExecuTorch) demandent seulement que leur mention accompagne
l'app : c'est le petit lien « Composants open source » en bas du menu. Détail : `scripts/ml/README.md`.
