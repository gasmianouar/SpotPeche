# Conception : reconnaissance des espèces sur le téléphone (0 $)

*24 novembre 2026 · statut : validée (choix recommandés retenus par l'utilisateur) · aucun code écrit*

## 1. Intention

Spot est gratuit et doit le rester : **0 $ de coût par utilisateur**, quel que soit leur nombre. La reconnaissance d'espèce par photo appelle aujourd'hui l'API Claude (payante) via le serveur `fish-activity-agent`. On la remplace par un **petit modèle qui tourne sur le téléphone** : gratuit, illimité, et utilisable sans réseau au bord de l'eau.

Les utilisateurs pêchent **surtout en mer** (Méditerranée, Atlantique, Manche, sans région privilégiée). Le catalogue d'espèces, aujourd'hui en eau douce seulement, devient majoritairement marin.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Reconnaître l'espèce d'un poisson sur une photo, sur le téléphone, sans aucun appel réseau payant.
- Proposer jusqu'à 3 espèces du catalogue, avec une confiance, comme aujourd'hui (même écran, même cas d'usage).
- Savoir dire « je ne sais pas » (photo floue, poisson absent du catalogue).
- Pouvoir ajouter une espèce au catalogue **sans réentraîner le modèle**.

**Non-objectifs (pour ce chantier)**
- L'activité des poissons et l'indice de pêche : l'algorithme local reste en place, déjà gratuit. La **marée** (essentielle en mer) sera un chantier séparé.
- La reconnaissance des appâts (déjà retirée).
- Une version payante. Le code de l'agent Claude (`AgentImageRecognizer`, serveur `/recognize`) reste dans le projet mais n'est plus branché.

**Anti-objectifs (ce qui serait un échec même si « ça marche »)**
- Une réponse inventée, hors catalogue, ou une confiance élevée sur une mauvaise espèce.
- Un coût, même faible, qui grandit avec le nombre d'utilisateurs.
- Une reconnaissance qui demande le réseau, ou qui fige l'écran plusieurs secondes.
- Une app qui plante si le modèle ne se charge pas.

## 3. Ce que le test a montré (spike du 24/11)

Test hors app (`.tmp/fishial/evaluate.py`) sur 92 photos iNaturalist de 12 espèces marines connues du modèle, plus 2 espèces inconnues :

| Réglage | 1re réponse juste | Dans les 3 premières |
|---|---|---|
| Photo entière | 26 % | 38 % |
| + recadrage sur le poisson (détecteur) | 57 % | 78 % |
| + réponses limitées au catalogue (53 espèces) | **75 %** | **89 %** |

- Très bon : daurade royale, sar à tête noire, maquereau, vieille, marbré, bar, chinchard. Raté : pageot (pris pour un pagre ou une daurade).
- Sole (absente) : marquée « incertaine » dans 100 % des cas. Mulet lippu (absent) : classé mulet cabot.
- Modèle : 29,4 M de paramètres, environ 29 Mo en int8. 60 ms par photo sur le processeur du serveur.
- Limites : petit échantillon, et recouvrement possible avec les données d'entraînement de Fishial.

**Conclusion : les deux étapes, recadrage puis filtre sur le catalogue, sont indispensables.**

## 4. Approches envisagées

| Approche | Pour | Contre | Décision |
|---|---|---|---|
| **A. Modèles Fishial (classifieur à empreinte) + détecteur** | Déjà entraînés sur des centaines d'espèces, marines comprises (42 de nos 58 espèces cibles). Licence MIT. On ajoute une espèce avec quelques photos. | Deux modèles à embarquer, qualité à confirmer sur de vraies prises. | **Retenue** (choix de l'utilisateur, validée par le test). |
| B. BioCLIP (reconnaissance à partir du nom) | Ajout d'une espèce par son seul nom. | Trop lourd pour un téléphone (ViT-L, centaines de Mo), lent. | Écartée. |
| C. Entraîner notre propre petit modèle | Très léger (5 à 10 Mo), précis sur une liste fixe. | Milliers de photos à réunir, entraînement à refaire à chaque espèce. | Écartée pour l'instant. Repli si A déçoit sur le téléphone. |
| Offres d'IA « gratuites » dans le cloud (Workers AI…) | Rien à embarquer. | Quota global épuisé en minutes avec 1 000 utilisateurs. | Écartée. |

## 5. La conception

### 5.1 Le parcours d'une photo

```
Photo (expo-image-picker)
  └► 1. Détecteur de poissons ──► boîte du poisson le plus sûr (+10 % de marge) ──► recadrage
         (aucun poisson trouvé → photo entière, et la note le signale)
  └► 2. Classifieur ConvNeXt Tiny ──► empreinte (256 nombres) + probabilités
  └► 3. Score sur le catalogue uniquement ──► top 3
  └► 4. Règle « je ne sais pas » ──► RecognitionOutcome { candidates, note }
```

Tout se passe sur le téléphone. Aucune photo ne quitte l'appareil.

### 5.2 Dans l'architecture actuelle

Le contrat `ImageRecognizer` prévoit déjà « un modèle embarqué ». On ajoute une implémentation, sans toucher au cas d'usage `RecognizeFromPhoto` ni à l'écran :

```
RecognitionScreen ─► useRecognitionViewModel ─► RecognizeFromPhoto ─► ImageRecognizer (port, inchangé)
                                                                        └► OnDeviceImageRecognizer   ← nouveau
                                                                             ├► FishDetector (port)    ◄─ ExecuTorch
                                                                             ├► SpeciesEmbedder (port) ◄─ ExecuTorch
                                                                             └► scoreSpecies()         ← fonction pure, testée sous Jest
```

- **`scoreSpecies`** (domaine, pur) : à partir de l'empreinte, des probabilités et des empreintes de référence du catalogue, calcule le score de chaque espèce, garde le top 3 et applique la règle « je ne sais pas ». C'est là que vit la logique métier, testable sans téléphone.
- **`FishDetector` / `SpeciesEmbedder`** : deux petits contrats, implémentés avec ExecuTorch. Les tests utilisent des faux qui renvoient des valeurs fixes.
- **`container.ts`** : `RecognizeFromPhoto` reçoit `OnDeviceImageRecognizer`, sans condition sur `EXPO_PUBLIC_SPOT_AI_URL`. `QuotaLimitedImageRecognizer` est retiré du branchement : la reconnaissance devient illimitée, puisqu'elle est gratuite. La limite `species-recognition` de `FREE_DAILY_LIMITS` n'est plus utilisée (on la garde pour une future version payante, ou on la retire : au choix du développeur).
- **Erreurs** : si un modèle ne se charge pas, on lève `RecognitionUnavailableError`. L'écran affiche déjà « Reconnaissance indisponible… choisissez dans la liste ».

### 5.3 Le score et le « je ne sais pas »

- **Filtre sur le catalogue** : seules les espèces du catalogue peuvent être proposées (c'est ce qui fait passer de 57 % à 75 %).
- **Empreintes de référence** : pour chaque espèce du catalogue, on calcule hors ligne une empreinte moyenne (« centroïde ») et on l'embarque dans un petit fichier (environ 60 espèces × 256 nombres, quelques dizaines de Ko). On n'embarque pas la base de 114 000 empreintes de Fishial.
- **Espèces que Fishial ne connaît pas** (mulets *Chelon*, sole, maigre, corb, vive…) ou mal reconnues (pageot) : leur centroïde est calculé à partir de 20 à 50 photos de référence sous licence libre. Pas de réentraînement.
- **Combinaison** : le score mélange la probabilité des têtes de classification (pour les espèces connues de Fishial) et la similarité au centroïde (pour toutes). La pondération est réglée sur le jeu de test (voir 5.6).
- **« Je ne sais pas »** : si la meilleure espèce a un score faible **ou** si l'empreinte est loin de tous les centroïdes, on renvoie un `RecognitionOutcome` sans proposition (`candidates: []`), avec une note (« Poisson non reconnu : il n'est peut-être pas dans le catalogue »). Les seuils de départ viennent du test (probabilité < 0,35 ou similarité < 0,7), puis sont recalibrés.

### 5.4 Le catalogue marin

- Environ **50 espèces marines** pêchées du bord ou en bateau (bars, daurade, sars, pageots, dorades, mulets, maquereaux, chinchard, liche, sériole, lieus, vieilles, congre, rascasse, rouget, sole, seiche, calmar…), plus les **8 espèces d'eau douce** actuelles.
- Chaque espèce : identifiant, nom français, nom latin, illustration, et sa source de référence (« Fishial » ou « photos de référence »).
- `SPECIES_CATALOG` grandit. L'écran de choix (`CatalogPickerScreen`) a déjà une recherche, mais avec 58 espèces il faudra probablement un **tri par milieu (mer / eau douce)**.

### 5.5 Moteur et livraison du modèle

- **Moteur** : `react-native-executorch` (Software Mansion), prévu pour Expo et l'architecture moderne de React Native. Les modèles Fishial sont en PyTorch, d'où une conversion directe en `.pte`. La normalisation de l'image (moyenne et écart type ImageNet) est **intégrée au modèle exporté**, pour que l'app n'ait qu'à redimensionner l'image en 224 × 224.
- **Compression** : quantification int8, à condition de ne pas perdre plus de 2 points de précision sur le jeu de test.
- **Détecteur** : **le détecteur YOLO nano de Fishial (MIT) en priorité**, parce qu'il est environ 25 Mo plus léger. On vérifie qu'il recadre aussi bien que RF-DETR Nano (Apache 2.0, celui du test) avec le script d'évaluation, et qu'il s'exporte vers ExecuTorch. Si l'un des deux échoue, on se replie sur RF-DETR Nano.
- **Livraison** : les modèles sont **inclus dans l'app**, pour que la reconnaissance marche hors ligne dès la première utilisation. Publication en **AAB**, pour que chaque téléphone ne télécharge que la version faite pour son processeur.
- **Taille** : APK de production arm64 estimé entre 60 et 90 Mo avec YOLO nano (aujourd'hui, environ 30 à 45 Mo, non mesuré). La première tâche **mesure** la taille réelle d'une version de production avant et après l'ajout du moteur et des modèles.
- **Plateformes** : **Android d'abord**, compilable et testable sur le poste Windows. iOS ensuite (EAS Build dans le cloud, compte Apple Developer payant). Les contrats `FishDetector` / `SpeciesEmbedder` et ExecuTorch fonctionnent sur les deux plateformes : iOS ne demandera pas de reconception.
- **Risque technique n° 1, à lever dès la première tâche avec l'export du détecteur** : ExecuTorch attend une image décodée en pixels (`ImageBuffer` : données, largeur, hauteur), alors que `expo-image-picker` fournit un fichier JPEG. Il faut un moyen fiable, sans librairie lourde, de passer du fichier aux pixels redimensionnés. On le vérifie sur l'émulateur avant tout le reste.
- **Recompilation** : nouvelle librairie native, donc recompilation une fois (`expo run:android`) en respectant les règles du disque D: (`AGENTS.md`).
- **Licences** : mentions MIT (Fishial) et Apache 2.0 (détecteur) dans l'écran « À propos ».

### 5.6 Critères d'acceptation

| Critère | Seuil |
|---|---|
| Précision sur un jeu de test **séparé** (≥ 10 photos par espèce, aucune utilisée pour les centroïdes) | ≥ 70 % en 1re réponse, ≥ 85 % dans les 3 premières |
| Espèces absentes du catalogue | marquées « je ne sais pas » ≥ 80 % du temps |
| Temps sur un Android de milieu de gamme (photo → résultat) | < 1 s, sans figer l'écran |
| Taille ajoutée à l'app | ≤ 85 Mo (décision du 24/11 : modèles 60,2 Mo + moteur ExecuTorch) |
| Réseau et coût | aucun appel réseau pendant la reconnaissance, 0 $ |

Le script d'évaluation hors app devient un **contrôle obligatoire** à chaque changement de catalogue ou de modèle.

### 5.7 Tests

- **Jest (sans téléphone)** : `scoreSpecies` (filtre catalogue, top 3, seuils, espèces ajoutées par centroïde), `OnDeviceImageRecognizer` avec faux détecteur et faux classifieur (pas de poisson, modèle absent, recadrage), cas d'usage inchangés.
- **Hors app (Python)** : précision et calibration des seuils sur le jeu de test, comparaison avant et après la compression int8.
- **Sur téléphone** : temps de réponse et mémoire sur l'émulateur, puis sur un vrai Android.

### 5.8 Documentation

Un `docs/SPRINT-7.md` (ce qui change, le parcours d'une photo, comment ajouter une espèce). Le Sprint 6 et le README du serveur indiquent que la reconnaissance par Claude est débranchée.

## 6. Décisions prises

1. **Illustrations** : une **silhouette par famille**, dans le style des PNG actuels (`assets/catalog`, en 1x, 2x et 3x). Il y aura une douzaine de familles : bars, sparidés (daurade, sars, pageots…), mulets, maquereaux et thons, gadidés (lieus, merlan…), labres, poissons plats, congre et murène, rascasses et rougets, céphalopodes, roussette, eau douce. Chaque espèce affiche la silhouette de sa famille. Les dessins par espèce pourront remplacer les silhouettes peu à peu, sans changer le code (`catalogImages.ts`). Les 8 illustrations d'eau douce existantes sont conservées. C'est léger, cohérent, et ça évite les questions de droits des photos.
2. **Modèles inclus dans l'app** (pas de téléchargement au premier usage), publiés en AAB.
3. **Android d'abord**, iOS dans un second temps.
4. **Détecteur YOLO de Fishial en priorité**, avec repli sur RF-DETR Nano. *(Tâche 1 : retenu, à 416 px. C'est en réalité un YOLO26m.)*
5. **Taille (24/11, après la tâche 1)** : les modèles int8 font 60,2 Mo (classifieur 35,2 Mo + détecteur 25,0 Mo). L'utilisateur accepte environ 75 Mo de plus dans l'app (option « tout embarquer »), pour garder la reconnaissance hors ligne dès l'installation. On tente de réduire le classifieur à la tâche 4 (quantification statique avec plus de photos de calibration), sans perdre plus de 2 points.

## 7. Laissé au développeur

- La pondération exacte entre probabilité et similarité au centroïde, et les seuils, réglés sur le jeu de test.
- Le choix final du détecteur, selon le résultat de l'export.
- Le format du fichier des centroïdes et les scripts de génération (dans `scripts/`).
- Le redimensionnement de l'image avant le modèle (bibliothèque Expo existante ou fonction d'ExecuTorch).
