# Reconnaissance des espèces sur le téléphone : scripts

Ces scripts préparent, **hors de l'app**, les fichiers embarqués dans `assets/models/` et contrôlent la précision.
Conception : `docs/superpowers/specs/2026-11-24-reconnaissance-embarquee-design.md` · plan : `docs/superpowers/plans/2026-11-24-reconnaissance-embarquee.md`.

## Les fichiers

| Script | Rôle |
|---|---|
| `fishial_model.py` | Classifieur Fishial ConvNeXt Tiny v9.2 (MIT) et chargement des poids EMA. `SpeciesEmbedder` = ce qui est exporté, normalisation ImageNet comprise. |
| `detectors.py` | Détecteur RF-DETR Nano (PyTorch), recadrage au ras de la boîte. |
| `rfdetr_module.py` | RF-DETR Nano sous la forme exportée vers l'app (normalisation et sigmoïde incluses, sortie [1, 300, 5]). |
| `cache_embeddings.py` | Calcule une fois les empreintes de toutes les photos avec les `.pte` (pour `train_head.py` et `app_accuracy.py`). |
| `pte_runtime.py` | Fait tourner les `.pte` comme l'app : photo étirée, choix du poisson principal. |
| `export_models.py` | Exporte `species-embedder.pte` et `fish-detector.pte`. |
| `evaluate.py` | Contrôle de précision par espèce, en PyTorch ou sur les `.pte`. |

Modèles sources (non versionnés, dans `.tmp/ml/models/`) : `classification_rectangle_v9-2.zip` de https://github.com/fishial/fish-identification (MIT)
et `cfd-rf-detr-nano-640-….pth` du Community Fish Detector, https://github.com/filippovarini/community-fish-detector (Apache 2.0).

## Formats des modèles embarqués (contrat avec l'app, tâche 7)

**`species-embedder.pte`**
- entrée : `float32 [1, 3, 224, 224]`, RGB, valeurs **0 à 1**, image recadrée et étirée en 224 × 224 (bilinéaire). La normalisation ImageNet est **dans** le modèle ;
- sorties : `[0]` empreinte `float32 [1, 256]` normée L2, `[1]` probabilités `float32 [1, 639]`, moyenne des têtes ArcFace et FC ;
- `species-labels.json` : les 639 noms latins, à l'indice de chaque probabilité.

**`fish-detector.pte`** (Community Fish Detector, RF-DETR Nano, depuis le 26/11)
- entrée : `float32 [1, 3, 384, 384]`, RGB, 0 à 1, **photo entière étirée** en 384 × 384 (bilinéaire, pas de marges). La normalisation ImageNet est dans le modèle ;
- sortie : `float32 [1, 300, 5]`, une ligne par requête : `cx, cy, w, h` en **fractions de la photo** (0 à 1), puis le score (0 à 1) ;
- lecture : si le meilleur score est < 0,3, il n'y a pas de poisson. Sinon, **poisson principal** : parmi les lignes dont le score atteint 60 % du meilleur, la plus grande boîte (`w × h`). En pixels : `x0 = (cx − w/2) × largeur`, etc. Pas de NMS ;
- recadrage **au ras de la boîte** (marge 0).

## Décisions de la tâche 1 (24/11/2026)

Jeu du spike : 121 photos iNaturalist (`.tmp/fishial/spot-test-photos.json`), 92 d'espèces du catalogue de test (53 espèces).

| Configuration | Paramètres | 1re réponse | Top 3 | Détection (CPU serveur) |
|---|---|---|---|---|
| RF-DETR Nano 1024 | 30,5 M | 75 % | 89 % | 523 ms |
| YOLO26 Fishial, 640 px | 21,8 M | 75 % | 88 % | 509 ms |
| YOLO26 Fishial, 416 px | 21,8 M | 78 % | 88 % | 214 ms |
| YOLO26 Fishial, 320 px | 21,8 M | 75 % | 85 % | 138 ms |
| **`.pte` float32 (YOLO 416)** | | **79 %** | **88 %** | 155 ms |
| **`.pte` int8 retenus** | | **78 %** | **88 %** | 92 ms |

- *(Remplacé le 26/11 par RF-DETR, voir plus bas.)* **Détecteur retenu : YOLO26 de Fishial à 416 px.** Même précision que RF-DETR, moins de paramètres, deux fois plus rapide à 416 px. Attention : malgré son nom (« v26_n3 »), c'est un **YOLO26m (medium)**, pas un nano.
- **Classifieur : quantification dynamique** (poids int8 des couches linéaires, activations en float) : **35,2 Mo**, sans perte. La quantification statique (29,3 Mo) faisait perdre 11 points (79 % → 68 %) : refusée.
- **Détecteur : int8 statique, sauf la tête `model.23`**, qui reste en float (scores et coordonnées partagent la même sortie, et un int8 commun écrasait les scores) : **25,0 Mo**, perte de 1 point.
- **La version v9.2 ne connaît pas le pageot** (*Pagellus erythrinus*). Il faudra des photos de référence (tâche 4).
- Réserve : le détecteur est calibré et évalué sur les mêmes 121 photos. Le contrôle de la tâche 4 se fera sur un jeu de test séparé.

**Taille : les deux modèles font 60,2 Mo**, soit la totalité du budget de 60 Mo prévu, avant même le moteur ExecuTorch. Voir la note de faisabilité (tâche 2).

## Commandes

```bat
python scripts\ml\export_models.py --classifier .tmp\ml\models\v9-2 --detector .tmp\ml\models\cfd-rf-detr-nano-640.pth ^
    --int8 --out assets\models
python scripts\ml\cache_embeddings.py --pte assets\models --photos ".tmp\ml\photos\*.json" --out .tmp\ml\embeddings.npz
python scripts\ml\train_head.py --cache-file .tmp\ml\embeddings.npz --catalog .tmp\ml\catalog.json --out assets\models\species-head.json
python scripts\ml\app_accuracy.py --pte assets\models --cache-file .tmp\ml\embeddings.npz --catalog .tmp\ml\catalog.json --min-confidence 0.1
python scripts\ml\evaluate.py --model .tmp\ml\models\v9-2 --photos .tmp\fishial\spot-test-photos.json ^
    --pte assets\models --catalog .tmp\ml\catalog.json --min-top1 0.70 --min-top3 0.85
```

## Décisions de la tâche 4 (24/11/2026)

Photos : 2 630 photos iNaturalist « research » sous licence CC (manifeste dans chaque JSON : observation, licence, attribution),
40 par espèce du catalogue (30 `ref` pour apprendre, 10 `test` pour contrôler) et 10 pour 3 espèces hors catalogue.
Fichiers `spot-photos-01.json` à `09.json` (non versionnés, dans `.tmp/ml/photos/`).

| Méthode (65 espèces, 650 photos de test) | 1re réponse | Top 3 |
|---|---|---|
| Centroïdes de nos photos (plan initial) | 64 % | 80 % |
| Centroïdes de la base Fishial | 59 % | 72 % |
| 10 plus proches voisins | 67 % | 81 % |
| Couche de décision apprise (régression logistique) | 68 % | 83 % |
| **Couche apprise + mulets, lieus, chinchards regroupés (60 entrées)** | **72,6 %** | **85,5 %** |

- Plus de photos de référence aide peu (10 → 20 → 30 par espèce : 63 → 67 → 68 %) : l'empreinte Fishial plafonne.
- **Retenu** : une classe par espèce, puis les probabilités des membres d'un groupe du catalogue sont additionnées
  (`species-head.json`, 65 classes, 130 Ko). Les photos sans poisson détecté sont gardées pour apprendre.
- **« Je ne sais pas »** : aucune méthode ne reconnaît de façon fiable une espèce hors catalogue. Le seuil de confiance
  est fixé à 0,1 (1 % des photos du catalogue marquées incertaines) ; l'écran présente toujours des propositions
  « à vérifier » et le bouton « Choisir dans la liste ».
- Réserve : le réglage `C = 4` et le seuil ont été choisis sur le jeu de test lui-même ; refaire un contrôle avec
  de nouvelles photos (vraies prises) avant de publier.

```bat
npx tsx scripts\ml\dump-catalog.ts > .tmp\ml\catalog.json
python scripts\ml\train_head.py --pte assets\models --catalog .tmp\ml\catalog.json --photos ".tmp\ml\photos\*.json" --out assets\models\species-head.json
python scripts\ml\app_accuracy.py --pte assets\models --catalog .tmp\ml\catalog.json --photos ".tmp\ml\photos\*.json"
```

## Décisions du 26/11/2026 : RF-DETR Nano remplace YOLO26

Raison : le YOLO26 de Fishial est entraîné avec Ultralytics, qui revendique l'**AGPL-3.0** sur ses modèles. Le
Community Fish Detector RF-DETR Nano est sous **Apache 2.0** (paquet `rfdetr` et poids). L'app ne contient plus aucun
composant AGPL ; seules les mentions MIT et Apache 2.0 sont dues (lien « Composants open source » en bas du menu).

Export : constantes repliées avant l'export (`constant_prop_pass` : sans cela, masques et plongements de position sont
recalculés hors XNNPACK, deux fois plus lent), puis **int8 dynamique** de toutes les couches linéaires sauf les deux
petites têtes finales : **39,6 Mo**, 215 ms par photo sur le CPU du serveur (YOLO int8 : 25,0 Mo, 69 ms).

Mêmes 650 photos de test, couche de décision réapprise pour chaque réglage, seuil de confiance 0,1 :

| Réglage | 1re réponse | Top 3 |
|---|---|---|
| YOLO26, marge 10 % (livré le 24/11) | 72,6 % | 85,5 % |
| YOLO26, marge 0 (pour comparer) | 74,2 % | 85,4 % |
| RF-DETR 384 px, meilleur score, marge 10 % | 67,5 % | 79,4 % |
| RF-DETR 512 px, meilleur score, marge 10 % | 67,2 % | 79,7 % |
| RF-DETR 384 px, meilleur score, marge 0 | 70,3 % | 80,5 % |
| **RF-DETR 384 px, poisson principal, marge 0 (retenu)** | **70,9 %** | **82,8 %** |

- Une résolution plus haute n'aide pas ; une marge plus grande ou négative fait perdre des points.
- Les deux détecteurs trouvent un poisson sur 94 % des photos, mais choisissent un poisson différent sur environ
  15 % d'entre elles (photos à plusieurs poissons) : d'où le choix du « poisson principal ».
- **Le seuil top 3 ≥ 85 % n'est plus atteint (82,8 %)** : c'est le prix de la licence Apache. Pistes : affiner
  RF-DETR sur des photos de prises (pêcheur tenant le poisson), ou ajouter des photos de référence.
