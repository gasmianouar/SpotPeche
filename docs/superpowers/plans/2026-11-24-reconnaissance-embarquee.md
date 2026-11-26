# Reconnaissance des espèces sur le téléphone : plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer la reconnaissance d'espèce par l'API Claude par un détecteur et un classifieur Fishial qui tournent sur le téléphone (0 $, hors ligne), sur un catalogue majoritairement marin.

**Architecture :** une nouvelle implémentation `OnDeviceImageRecognizer` du port existant `ImageRecognizer`. Elle enchaîne quatre étapes : lecture des pixels de la photo, détection du poisson, recadrage, puis empreinte et probabilités (ExecuTorch). La logique métier vit dans une fonction pure `scoreSpecies` : filtre sur le catalogue, centroïdes, top 3 et règle « je ne sais pas ». Les modèles sont exportés hors app par des scripts Python et embarqués dans `assets/models`.

**Tech Stack :** Expo 58, React Native 0.88, TypeScript 6, Jest 30 (jest-expo), `react-native-executorch` avec le resource fetcher Expo, Python 3.11 avec PyTorch et ExecuTorch pour l'export, modèles Fishial (MIT) et Community Fish Detector (Apache 2.0).

**Spec :** `docs/superpowers/specs/2026-11-24-reconnaissance-embarquee-design.md`

## Global Constraints

- Coût : 0 $, et aucun appel réseau pendant la reconnaissance.
- Précision sur le jeu de test séparé (≥ 10 photos par espèce, aucune utilisée pour les centroïdes) : **≥ 70 % en 1re réponse, ≥ 85 % dans les 3 premières**.
- Espèces absentes du catalogue : marquées « je ne sais pas » **≥ 80 %** du temps.
- Temps photo → résultat sur un Android de milieu de gamme : **< 1 s**, sans figer l'écran.
- Taille ajoutée à l'app : **≤ 85 Mo** (décision du 24/11 : modèles 60,2 Mo + moteur). Modèles **inclus dans l'app**, publication en AAB.
- Quantification int8 : perte de précision **≤ 2 points** par rapport au float32.
- Recadrage : boîte du poisson le plus sûr (seuil de détection **0,3**) avec **10 %** de marge. Classifieur en **224 × 224**, normalisation ImageNet `[0.485, 0.456, 0.406]` / `[0.229, 0.224, 0.225]` **intégrée au modèle exporté**.
- Seuils de départ de « je ne sais pas » : meilleure confiance **< 0,35** ou similarité au centroïde le plus proche **< 0,7**. Ils sont recalibrés à la tâche 4.
- **Android d'abord.** Le code ne doit rien contenir de propre à Android en dehors de la configuration native.
- Règle `AGENTS.md` : **tout sur le disque D:**. Variables d'environnement d'`AGENTS.md` avant npm, gradle, adb ou l'émulateur. Environnement Python et caches pip dans `D:\Android\ml-venv` et `D:\Android\pip-cache`. Toujours `npx expo install` pour ajouter une dépendance. Ne jamais éditer `android/` à la main (config plugins seulement).
- Textes de l'app en français, dans le ton des écrans existants.
- Photos de référence et de test : iNaturalist, qualité « research », licences CC uniquement. Licence et attribution gardées dans un manifeste. Photos stockées dans `.tmp/ml/` (ignoré par Git), jamais dans le dépôt.

## Review Focus

1. **Photo tournée (EXIF)** : une photo prise en portrait doit être analysée dans le bon sens. On attend le même résultat qu'avec la photo redressée (test à la tâche 6).
2. **Photo très lourde (12 Mpx et plus)** : pas de saturation mémoire. La photo est réduite à 1 024 px de côté avant la détection (test à la tâche 6).
3. **Photo sans poisson** (paysage, selfie, leurre seul) : on attend « je ne sais pas », pas une espèce au hasard (tests aux tâches 5 et 6).
4. **Modèle qui ne se charge pas** (fichier abîmé, mémoire insuffisante) : on attend `RecognitionUnavailableError` et le message de repli de l'écran, jamais un plantage (test à la tâche 7).
5. **Plusieurs poissons ou une main dans le cadre** : on recadre sur la boîte la plus sûre, pas sur la plus grande ni sur la première (test à la tâche 6).

---

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `scripts/ml/requirements.txt` | Dépendances Python des scripts (torch, torchvision, executorch, rfdetr, ultralytics, torch-ema, pillow, numpy). |
| `scripts/ml/fetch_inat_photos.py` | Télécharge les photos de référence et de test depuis iNaturalist et écrit `manifest.json` (licences, séparation référence / test). |
| `scripts/ml/fishial_model.py` | Classe `StableEmbeddingModel` de Fishial et chargement des poids EMA (repris de `.tmp/fishial/evaluate.py`). |
| `scripts/ml/export_models.py` | Exporte le détecteur et le classifieur en `.pte` (int8, normalisation intégrée) et écrit `species-labels.json`. |
| `scripts/ml/build_centroids.py` | Calcule les centroïdes du catalogue et écrit `species-centroids.json`. |
| `scripts/ml/evaluate.py` | Contrôle de précision, déplacé depuis `.tmp/fishial/` et généralisé : float32 ou `.pte`, rapport par espèce, code de sortie ≠ 0 sous les seuils. |
| `assets/models/fish-detector.pte`, `species-embedder.pte`, `species-labels.json`, `species-centroids.json` | Fichiers embarqués dans l'app. |
| `src/features/spots/domain/entities/Catalog.ts` | Catalogue marin et eau douce, avec `habitat` et `family`. |
| `src/features/spots/domain/recognition/RgbImage.ts` | Type `RgbImage` et fonctions pures `cropToBox`, `bestBox`. |
| `src/features/spots/domain/recognition/FishDetector.ts`, `SpeciesEmbedder.ts` | Ports du détecteur et du classifieur. |
| `src/features/spots/domain/recognition/scoreSpecies.ts` | Score sur le catalogue et « je ne sais pas » (pur). |
| `src/features/spots/data/recognition/OnDeviceImageRecognizer.ts` | Implémentation du port `ImageRecognizer`. |
| `src/features/spots/data/recognition/executorch/*.ts` | Adaptateurs ExecuTorch du détecteur et du classifieur. |
| `src/core/media/PhotoPixelsReader.ts` | Photo (URI) → `RgbImage` redressée et réduite. |
| `src/features/spots/presentation/catalog/catalogImages.ts` | Silhouette par famille pour les nouvelles espèces. |
| `src/core/di/container.ts` | Branchement. |
| `docs/SPRINT-7.md` | Documentation du sprint. |

---

### Task 1 : Export des modèles et choix du détecteur (hors app) · ✅ faite le 24/11 (voir `scripts/ml/README.md`)

Lève le premier risque de la conception : le détecteur s'exporte-t-il vers ExecuTorch, et YOLO nano recadre-t-il aussi bien que RF-DETR Nano ?

**Files :**
- Create : `scripts/ml/requirements.txt`, `scripts/ml/fishial_model.py`, `scripts/ml/export_models.py`, `scripts/ml/evaluate.py` (déplacé depuis `.tmp/fishial/evaluate.py`), `scripts/ml/README.md`
- Create (générés) : `assets/models/fish-detector.pte`, `assets/models/species-embedder.pte`, `assets/models/species-labels.json`
- Modify : `.gitignore` (ajouter `.tmp/ml/`, déjà couvert par `.tmp/` : vérifier seulement)

**Interfaces :**
- Produces : `species-embedder.pte`, avec en entrée un tenseur `float32 [1, 3, 224, 224]` en RGB **0 à 1** (la normalisation est faite dans le modèle), et en sorties `embedding [1, 256]` (normé L2), `probabilities [1, 639]` (moyenne des softmax ArcFace et FC, comme dans `evaluate.py`).
- Produces : `fish-detector.pte`, avec en entrée `float32 [1, 3, S, S]` en RGB 0 à 1 (S = taille native du détecteur retenu), et en sortie des boîtes `[N, 4]` en coordonnées normalisées 0 à 1 (x0, y0, x1, y1) avec `scores [N]`. Le format exact du tenseur est écrit dans `scripts/ml/README.md` pour la tâche 7.
- Produces : `species-labels.json` = `string[]` de 639 noms latins, à l'indice de la classe Fishial.

- [ ] **Step 1 : Préparer l'environnement Python sur D:**

Run (cmd) : `python -m venv D:\Android\ml-venv && D:\Android\ml-venv\Scripts\pip install --cache-dir D:\Android\pip-cache -r scripts\ml\requirements.txt`
Expected : installation sans erreur, `python -c "import torch, executorch"` réussit.

- [ ] **Step 2 : Comparer les deux détecteurs sur le jeu du spike**

Ajouter à `evaluate.py` l'option `--detector yolo|rfdetr <chemin>`. Télécharger `detector_v26_n3.zip` (Fishial) dans `.tmp/ml/models/`.
Run : `python scripts\ml\evaluate.py --model .tmp\ml\models\v9-2 --photos .tmp\fishial\spot-test-photos.json --detector yolo .tmp\ml\models\detector_v26_n3 --catalog`
Expected : rapport imprimé. On retient YOLO si sa précision en 1re réponse est au plus 3 points sous celle de RF-DETR (75 % au spike). Sinon RF-DETR. Noter la décision et les deux scores dans `scripts/ml/README.md`.

- [ ] **Step 3 : Implémenter `export_models.py`**

`python scripts/ml/export_models.py --classifier <dossier v9-2> --detector <yolo|rfdetr> <chemin> --out assets/models`. Le classifieur est enveloppé dans un `nn.Module` qui normalise l'entrée, puis applique `StableEmbeddingModel` avec les poids EMA. Il renvoie `(embedding, (arc + fc) / 2)`. Export avec `torch.export`, puis lowering XNNPACK et quantification int8 (PT2E). Écrire aussi `species-labels.json` depuis `database.pt['labels_keys']`.

- [ ] **Step 4 : Vérifier la perte due à l'int8**

Run : `python scripts\ml\evaluate.py --pte assets\models --photos .tmp\fishial\spot-test-photos.json --catalog`
Expected : 1re réponse ≥ (score float32 − 2 points). Fichiers : `species-embedder.pte` ≤ 35 Mo, détecteur ≤ 35 Mo (YOLO : attendu ≤ 8 Mo).

- [ ] **Step 5 : Commit**

```bash
git add scripts/ml assets/models
git commit -m "feat(ml): export ExecuTorch du détecteur et du classifieur Fishial"
```

---

### Task 2 : Faisabilité sur l'émulateur et taille réelle de l'APK

Lève le deuxième risque : passer du fichier JPEG aux pixels, et faire tourner les deux `.pte` dans l'app.

**Files :**
- Modify : `package.json`, `app.json` (plugins), `metro.config.js` (créer depuis `expo/metro-config` si absent ; ajouter `pte` à `resolver.assetExts`)
- Create : `src/core/media/PhotoPixelsReader.ts` (version minimale, finalisée à la tâche 6)
- Create : `docs/superpowers/notes/2026-11-24-faisabilite-executorch.md`

**Interfaces :**
- Produces : une dépendance `react-native-executorch` (et `@react-native-executorch/expo-resource-fetcher`) qui compile avec Expo 58 et RN 0.88. Un moyen validé d'obtenir des pixels RGB depuis l'URI d'une photo, documenté dans la note : quelle API, quelle librairie, quel format de sortie.

- [ ] **Step 1 : Mesurer la taille de référence**

Run : `npx.cmd expo prebuild --platform android --clean` puis `cd android && gradlew.bat bundleRelease` (variables d'`AGENTS.md`). Lire la taille arm64 avec `bundletool build-apks --mode=default` puis `bundletool get-size total`.
Expected : un chiffre en Mo, noté dans la note de faisabilité.

- [ ] **Step 2 : Installer ExecuTorch**

Run : `npx.cmd expo install react-native-executorch @react-native-executorch/expo-resource-fetcher expo-file-system expo-asset`
Lire la doc de la version installée (custom model `.pte`, entrée tenseur) avant d'écrire du code.

- [ ] **Step 3 : Écran de test temporaire (non commité)**

Charger les deux `.pte` depuis `assets/models` et les faire tourner sur une photo de la galerie, avec le lecteur de pixels retenu. Afficher le temps de chaque étape.
Expected sur l'émulateur : sorties aux formes de la tâche 1, et top 1 identique à `evaluate.py` sur 3 photos du jeu de test.

- [ ] **Step 4 : Mesurer après ajout**

Même mesure qu'au Step 1.
Expected : taille ajoutée ≤ 85 Mo. Sinon, s'arrêter et revenir vers l'utilisateur avec les chiffres.

- [ ] **Step 5 : Commit**

```bash
git add package.json package-lock.json app.json metro.config.js docs/superpowers/notes
git commit -m "chore: ajout d'ExecuTorch et note de faisabilité (taille, temps, lecture des pixels)"
```

---

### Task 3 : Catalogue marin

**Files :**
- Modify : `src/features/spots/domain/entities/Catalog.ts`
- Test : `src/features/spots/domain/entities/__tests__/Catalog.test.ts`

**Interfaces :**
- Produces :
  - `type Habitat = 'sea' | 'fresh'`
  - `type SpeciesFamily = 'bass' | 'sparid' | 'mullet' | 'mackerel' | 'gadid' | 'wrasse' | 'flatfish' | 'eel' | 'scorpionfish' | 'cephalopod' | 'shark' | 'freshwater' | 'other'`
  - `CatalogItem` gagne `habitat?: Habitat` et `family?: SpeciesFamily` (renseignés pour toutes les espèces, absents pour les appâts)
  - `SPECIES_CATALOG` : les 8 espèces d'eau douce actuelles (mêmes `id`) plus environ 50 espèces marines. Base : la liste des 58 espèces du spike (`.tmp/fishial/evaluate.py` et le document de conception, §5.4). `latinName` obligatoire pour chaque espèce.
  - `speciesByHabitat(habitat: Habitat): readonly CatalogItem[]`

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
it('contient surtout des espèces marines, et garde les 8 espèces d’eau douce', () => {
  expect(speciesByHabitat('sea').length).toBeGreaterThanOrEqual(45);
  expect(speciesByHabitat('fresh').map((s) => s.id)).toEqual(['brochet', 'sandre', 'perche', 'carpe', 'truite', 'blackbass', 'silure', 'gardon']);
});
it('donne à chaque espèce un id unique, un nom latin, un milieu et une famille', () => {
  const ids = SPECIES_CATALOG.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const s of SPECIES_CATALOG) expect(s).toEqual(expect.objectContaining({ latinName: expect.any(String), habitat: expect.any(String), family: expect.any(String) }));
});
it('connaît le bar, la daurade royale et le sar commun', () => {
  expect(findCatalogItems('species', ['bar', 'daurade', 'sar']).map((s) => s.latinName)).toEqual(['Dicentrarchus labrax', 'Sparus aurata', 'Diplodus sargus']);
});
```

- [ ] **Step 2 : Lancer et voir l'échec** · Run : `npx jest src/features/spots/domain/entities` · Expected : FAIL (`speciesByHabitat` absent).
- [ ] **Step 3 : Compléter `Catalog.ts`.** Les identifiants sont en minuscules, sans accent, courts (`bar`, `bar-mouchete`, `daurade`, `sar`, `sar-tete-noire`…).
- [ ] **Step 4 : Lancer tous les tests** · Run : `npx jest` · Expected : PASS. Corriger les tests existants qui comptaient 8 espèces.
- [ ] **Step 5 : Commit** · `git commit -m "feat(catalogue): espèces marines, milieu et famille"`

---

### Task 4 : Photos de référence, centroïdes et contrôle de précision

**Files :**
- Create : `scripts/ml/fetch_inat_photos.py`, `scripts/ml/build_centroids.py`, `scripts/ml/dump-catalog.ts` (imprime `SPECIES_CATALOG` en JSON, lancé avec `npx tsx`)
- Create (généré) : `assets/models/species-centroids.json`
- Modify : `scripts/ml/evaluate.py` (lit les centroïdes et applique le même score que `scoreSpecies`), `scripts/ml/README.md`

**Interfaces :**
- Consumes : `species-embedder.pte` et `species-labels.json` (tâche 1), `SPECIES_CATALOG` (tâche 3), exporté en JSON par `npx tsx scripts/ml/dump-catalog.ts > .tmp/ml/catalog.json`.
- Produces : `species-centroids.json` = `{ "version": 1, "dim": 256, "centroids": [{ "id": "bar", "vector": number[256] }] }`, vecteurs normés L2, une entrée par espèce du catalogue.
- Produces : les réglages calibrés `headWeight`, `minScore`, `minSimilarity`, écrits dans `scripts/ml/README.md` et utilisés comme valeurs par défaut à la tâche 5.

- [ ] **Step 1 : `fetch_inat_photos.py`.** Pour chaque `latinName` du catalogue : jusqu'à 50 photos « research » sous licence CC, réparties sans recouvrement d'observation en **référence** (40) et **test** (10). Plus 3 espèces hors catalogue pour le test « je ne sais pas » (*Solea senegalensis*, *Zeus faber*, *Balistes capriscus*). Le script tourne sur le PC (le réseau est requis). Sortie : `.tmp/ml/photos/{ref,test}/<id>/*.jpg` et `.tmp/ml/photos/manifest.json` (obs, licence, attribution).
- [ ] **Step 2 : `build_centroids.py`.** Détection, recadrage, empreinte (`.pte`) pour chaque photo de référence. Le centroïde d'une espèce est la moyenne normée de ses empreintes. Les photos où aucun poisson n'est détecté sont ignorées et comptées dans le rapport.
- [ ] **Step 3 : Calibrer sur le jeu de test.** `evaluate.py --calibrate` cherche sur une grille `headWeight ∈ {0, 0.25, 0.5, 0.75, 1}`, `minScore ∈ {0.2, 0.25, …, 0.5}` et `minSimilarity ∈ {0.6, 0.65, 0.7, 0.75}` le réglage qui respecte les trois seuils des Global Constraints avec la meilleure précision en 1re réponse.
- [ ] **Step 4 : Contrôle** · Run : `python scripts\ml\evaluate.py --pte assets\models --photos .tmp\ml\photos --split test` · Expected : code de sortie 0, et le rapport affiche ≥ 70 % / ≥ 85 % / ≥ 80 % « je ne sais pas » sur les espèces hors catalogue. Sinon, s'arrêter et revenir vers l'utilisateur avec le rapport par espèce.
- [ ] **Step 5 : Commit** · `git add scripts/ml assets/models/species-centroids.json && git commit -m "feat(ml): centroïdes du catalogue et contrôle de précision"`

---

### Task 5 : `scoreSpecies` (domaine, pur)

**Files :**
- Create : `src/features/spots/domain/recognition/scoreSpecies.ts`
- Test : `src/features/spots/domain/recognition/__tests__/scoreSpecies.test.ts`

**Interfaces :**
- Consumes : `RecognitionOutcome` (existant, `ImageRecognizer.ts`).
- Produces :

```ts
export interface SpeciesCentroid { readonly id: string; readonly vector: readonly number[] }
export interface ScoreInput {
  readonly embedding: readonly number[];                  // 256 valeurs, normé L2
  readonly probabilities: ReadonlyMap<string, number>;    // id du catalogue → probabilité de la tête Fishial (absent si Fishial ne connaît pas l'espèce)
  readonly centroids: readonly SpeciesCentroid[];          // une par espèce du catalogue
}
export interface ScoreOptions { readonly headWeight: number; readonly minScore: number; readonly minSimilarity: number; readonly maxCandidates: number }
export const DEFAULT_SCORE_OPTIONS: ScoreOptions;          // valeurs calibrées à la tâche 4 ; maxCandidates = 3
export const UNSURE_NOTE = 'Poisson non reconnu : il n’est peut-être pas dans le catalogue. Choisissez dans la liste.';
export function scoreSpecies(input: ScoreInput, options?: ScoreOptions): RecognitionOutcome;
```

Algorithme (à suivre exactement, c'est celui de `evaluate.py`) :
```
sim[id]     = produit scalaire(embedding, centroid[id].vector)
simNorm[id] = softmax sur le catalogue de (30 × sim[id])
pNorm[id]   = probabilities[id] / Σ probabilities (0 si absent ; 0 partout si la somme est nulle)
conf[id]    = headWeight × pNorm[id] + (1 − headWeight) × simNorm[id]
si max(conf) < minScore OU max(sim) < minSimilarity → { candidates: [], note: UNSURE_NOTE }
sinon → les maxCandidates meilleures { id, confidence: conf } par confiance décroissante
```

- [ ] **Step 1 : Écrire les tests qui échouent**, avec des vecteurs de dimension 3 pour la lisibilité :
  - `propose d’abord l’espèce dont le centroïde est le plus proche` : embedding = centroïde de `bar` ⇒ `candidates[0].id === 'bar'`.
  - `n’ajoute jamais une espèce absente des centroïdes`, même si `probabilities` contient `'requin'`.
  - `combine tête et centroïde selon headWeight` : avec `headWeight: 1`, l'ordre suit `probabilities` ; avec `headWeight: 0`, l'ordre suit les centroïdes.
  - `garde au plus maxCandidates propositions, triées`.
  - `répond « je ne sais pas » si le poisson est loin de tout centroïde` : toutes les similarités à 0,5 avec `minSimilarity: 0.7` ⇒ `{ candidates: [], note: UNSURE_NOTE }` (Review Focus 3).
  - `répond « je ne sais pas » si la meilleure confiance est trop basse`.
  - `fonctionne quand Fishial ne connaît aucune des espèces` (`probabilities` vide).
- [ ] **Step 2 : Lancer et voir l'échec** · `npx jest src/features/spots/domain/recognition` · FAIL.
- [ ] **Step 3 : Implémenter `scoreSpecies`.**
- [ ] **Step 4 : Lancer** · PASS.
- [ ] **Step 5 : Commit** · `git commit -m "feat(reconnaissance): score sur le catalogue et règle « je ne sais pas »"`

---

### Task 6 : Ports, recadrage, lecture des pixels et `OnDeviceImageRecognizer`

**Files :**
- Create : `src/features/spots/domain/recognition/RgbImage.ts`, `FishDetector.ts`, `SpeciesEmbedder.ts`
- Create : `src/features/spots/data/recognition/OnDeviceImageRecognizer.ts`
- Modify : `src/core/media/PhotoPixelsReader.ts` (finalisé à partir de la tâche 2)
- Test : `src/features/spots/domain/recognition/__tests__/RgbImage.test.ts`, `src/features/spots/data/__tests__/OnDeviceImageRecognizer.test.ts`

**Interfaces :**
- Consumes : `scoreSpecies`, `SpeciesCentroid`, `DEFAULT_SCORE_OPTIONS` (tâche 5), `ImageRecognizer`, `RecognitionOutcome`, `RecognitionUnavailableError` (existants).
- Produces :

```ts
// RgbImage.ts
export interface RgbImage { readonly data: Uint8Array; readonly width: number; readonly height: number } // RGB, 3 octets par pixel
export interface BoundingBox { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number; readonly confidence: number } // pixels
export const DETECTION_THRESHOLD = 0.3;
export const CROP_MARGIN = 0.1;
export function bestBox(boxes: readonly BoundingBox[], threshold?: number): BoundingBox | null; // la plus sûre ≥ seuil
export function cropToBox(image: RgbImage, box: BoundingBox, margin?: number): RgbImage;      // marge bornée à l'image
// FishDetector.ts
export interface FishDetector { detect(image: RgbImage): Promise<BoundingBox[]> }
// SpeciesEmbedder.ts
export interface EmbedderOutput { readonly embedding: number[]; readonly probabilities: ReadonlyMap<string, number> }
export interface SpeciesEmbedder { embed(image: RgbImage): Promise<EmbedderOutput> }
// PhotoPixelsReader.ts
export const MAX_PHOTO_SIDE = 1024;
export interface PhotoPixelsReader { read(photoUri: string): Promise<RgbImage> } // orientation EXIF appliquée, plus grand côté ≤ MAX_PHOTO_SIDE
export class ExpoPhotoPixelsReader implements PhotoPixelsReader { /* méthode validée à la tâche 2 */ }
// OnDeviceImageRecognizer.ts
export const NO_FISH_NOTE = 'Aucun poisson repéré nettement : toute la photo a été analysée.';
export class OnDeviceImageRecognizer implements ImageRecognizer {
  readonly isDemo = false;
  constructor(photos: PhotoPixelsReader, detector: FishDetector, embedder: SpeciesEmbedder, centroids: readonly SpeciesCentroid[], options?: ScoreOptions);
  recognize(photoUri: string): Promise<RecognitionOutcome>;
}
```

- [ ] **Step 1 : Écrire les tests qui échouent**
  - `RgbImage` : `bestBox` choisit la boîte de plus forte confiance, et non la plus grande ni la première (Review Focus 5). Elle renvoie `null` si tout est sous 0,3. `cropToBox` ajoute 10 % de marge et reste dans l'image pour une boîte collée au bord.
  - `OnDeviceImageRecognizer`, avec faux lecteur, faux détecteur et faux classifieur :
    - `recadre sur le poisson le plus sûr avant le classifieur` : le faux classifieur reçoit une image de la taille de la boîte agrandie de 10 %.
    - `analyse toute la photo et le signale quand aucun poisson n’est détecté` : le classifieur reçoit l'image entière, et la note contient `NO_FISH_NOTE`.
    - `renvoie le résultat de scoreSpecies` : l'embedding égal au centroïde de `bar` donne `candidates[0].id === 'bar'`.
    - `transforme un échec du lecteur, du détecteur ou du classifieur en RecognitionUnavailableError` (Review Focus 4).
    - `n’appelle jamais le réseau` : `global.fetch = jest.fn()`, puis `expect(fetch).not.toHaveBeenCalled()`.
  - `PhotoPixelsReader` : le test d'orientation EXIF et de réduction se fait **sur l'émulateur** (une photo portrait et une photo de 12 Mpx de `.tmp/ml/photos/test`). Il se note dans la note de faisabilité (Review Focus 1 et 2), car la librairie native n'est pas simulable sous Jest.
- [ ] **Step 2 : Lancer et voir l'échec** · `npx jest src/features/spots` · FAIL.
- [ ] **Step 3 : Implémenter** `RgbImage.ts`, les ports, `OnDeviceImageRecognizer`. Finaliser `PhotoPixelsReader` avec la méthode validée à la tâche 2, en appliquant l'orientation et la réduction.
- [ ] **Step 4 : Lancer** · PASS, et `npx tsc --noEmit` sans erreur.
- [ ] **Step 5 : Commit** · `git commit -m "feat(reconnaissance): OnDeviceImageRecognizer, recadrage et lecture des pixels"`

---

### Task 7 : Adaptateurs ExecuTorch

**Files :**
- Create : `src/features/spots/data/recognition/executorch/ExecutorchFishDetector.ts`, `ExecutorchSpeciesEmbedder.ts`, `loadModel.ts`, `centroids.ts`
- Test : `src/features/spots/data/__tests__/ExecutorchSpeciesEmbedder.test.ts` (module ExecuTorch simulé avec `jest.mock`)

**Interfaces :**
- Consumes : formats des tenseurs de la tâche 1 (`scripts/ml/README.md`), `FishDetector`, `SpeciesEmbedder`, `RgbImage`, `BoundingBox` (tâche 6), `SPECIES_CATALOG` (tâche 3).
- Produces :
  - `loadModel(asset: number): Promise<…>` : charge un `.pte` **une seule fois** (promesse mémorisée par asset) et la partage entre les appels. Un échec de chargement rejette, sans être mémorisé (on pourra réessayer).
  - `ExecutorchSpeciesEmbedder implements SpeciesEmbedder` : redimensionne en 224 × 224 (bilinéaire), convertit en `float32` CHW 0 à 1 et appelle le modèle. La sortie 639 est convertie en `Map` **par id du catalogue** via `species-labels.json` et `latinName`. Les classes hors catalogue sont ignorées.
  - `ExecutorchFishDetector implements FishDetector` : redimensionne à la taille du détecteur et remet les boîtes en pixels de l'image d'entrée.
  - `loadCentroids(): readonly SpeciesCentroid[]` depuis `assets/models/species-centroids.json`. Lève une erreur si une espèce du catalogue n'a pas de centroïde.

- [ ] **Step 1 : Écrire les tests qui échouent**
  - `ne garde que les espèces du catalogue, indexées par id` : sortie simulée avec une forte probabilité à l'indice de *Sparus aurata* ⇒ `probabilities.get('daurade')` est la plus forte, et aucune clé hors catalogue n'apparaît.
  - `charge le modèle une seule fois pour plusieurs reconnaissances` : 3 appels à `embed`, 1 seul chargement.
  - `un chargement raté est retenté au prochain appel` (Review Focus 4).
  - `loadCentroids` : une entrée par espèce du catalogue, vecteurs de longueur 256.
- [ ] **Step 2 : Lancer et voir l'échec** · FAIL.
- [ ] **Step 3 : Implémenter**, selon l'API ExecuTorch validée à la tâche 2.
- [ ] **Step 4 : Lancer** · PASS, `npx tsc --noEmit` sans erreur.
- [ ] **Step 5 : Commit** · `git commit -m "feat(reconnaissance): adaptateurs ExecuTorch du détecteur et du classifieur"`

---

### Task 8 : Branchement, fin de la limite et textes de l'écran

**Files :**
- Modify : `src/core/di/container.ts`, `src/features/spots/presentation/recognition/useRecognitionViewModel.ts`, `src/features/freeQuota/domain/FreeQuota.ts`
- Test : `src/features/freeQuota/domain/__tests__/FreeQuota.test.ts`, tests existants de la reconnaissance

**Interfaces :**
- Consumes : `OnDeviceImageRecognizer` (tâche 6), adaptateurs et `loadCentroids` (tâche 7), `ExpoPhotoPixelsReader` (tâche 6).

- [ ] **Step 1 : Adapter les tests.** `FREE_DAILY_LIMITS` ne contient plus que `'fish-activity'` (`AiFeature = 'fish-activity'`). Supprimer les tests de `QuotaLimitedImageRecognizer` avec la classe. `AgentImageRecognizer` et `DemoImageRecognizer` restent, avec leurs tests, mais ne sont plus branchés.
- [ ] **Step 2 : Lancer et voir l'échec** · FAIL.
- [ ] **Step 3 : Implémenter.**
  - `container.ts` : `recognizeFromPhoto: new RecognizeFromPhoto(new OnDeviceImageRecognizer(new ExpoPhotoPixelsReader(), new ExecutorchFishDetector(), new ExecutorchSpeciesEmbedder(), loadCentroids()))`, **sans condition** sur `env.spotAiUrl`.
  - ViewModel : `RECOGNITION_PHOTO = { quality: 0.8 }` (plus d'envoi réseau, une meilleure qualité aide le modèle). Retirer la branche `FreeLimitReachedError`. Message d'indisponibilité : `'Reconnaissance indisponible sur ce téléphone. Choisissez l’espèce dans la liste.'`. Message par défaut quand rien n'est reconnu : `UNSURE_NOTE`.
- [ ] **Step 4 : Lancer** · `npx jest` PASS, `npx tsc --noEmit` et `npx expo lint` sans erreur.
- [ ] **Step 5 : Commit** · `git commit -m "feat(reconnaissance): branchement sur le téléphone, sans limite ni réseau"`

---

### Task 9 : Silhouettes par famille, choix par milieu et mentions des licences · ✅ code fait le 24/11 (vérification visuelle sur l'émulateur à faire)

**Files :**
- Create : `assets/catalog/family-<family>.png`, `@2x` et `@3x` (12 familles, sauf `freshwater` qui garde les illustrations par espèce), dans le style des PNG existants
- Modify : `src/features/spots/presentation/catalog/catalogImages.ts`, `src/features/spots/presentation/picker/CatalogPickerScreen.tsx`, `CatalogPickerVm.ts`, `useCatalogPickerViewModel.ts`, `src/features/spots/presentation/contribute/useSpotItemsPickerViewModel.ts`
- Create : écran ou section « À propos » avec les mentions MIT (Fishial) et Apache 2.0 (détecteur, si retenu), là où le menu (`features/menu/presentation/menuItems.ts`) le permet
- Test : `src/features/spots/presentation/catalog/__tests__/catalogImages.test.ts`

**Interfaces :**
- Produces : `catalogImage('species', id)` renvoie l'illustration propre à l'espèce si elle existe, sinon la silhouette de sa `family`. Elle ne renvoie jamais `undefined` pour une espèce.
- Produces : `CatalogPickerVm` gagne `habitat: Habitat | 'all'` et `setHabitat(h)`. Les deux ViewModels de choix filtrent `items` par milieu, `'sea'` par défaut pour les espèces. Rien ne change pour les appâts.

- [ ] **Step 1 : Tests qui échouent** : `toute espèce du catalogue a une image`, et `une espèce sans dessin propre affiche la silhouette de sa famille`. Pour les ViewModels : `n’affiche que les espèces marines par défaut`, et `« Tout » affiche les 58 espèces`.
- [ ] **Step 2 : FAIL** · **Step 3 : Implémenter** (dessins, `catalogImages`, filtre « Mer · Eau douce · Tout » au-dessus de la recherche, mentions des licences) · **Step 4 : PASS** et vérification visuelle sur l'émulateur.
- [ ] **Step 5 : Commit** · `git commit -m "feat(catalogue): silhouettes par famille, filtre par milieu, mentions des licences"`

---

### Task 10 : Recette sur téléphone et documentation · 📝 documentation faite le 24/11, recette sur téléphone à faire

**Files :**
- Create : `docs/SPRINT-7.md`
- Modify : `docs/SPRINT-6.md` (section reconnaissance : débranchée, renvoi au Sprint 7), `server/fish-activity-agent/README.md` (`/recognize` n'est plus utilisé par l'app), `docs/superpowers/notes/2026-11-24-faisabilite-executorch.md` (résultats finaux)

- [ ] **Step 1 : Recette sur l'émulateur, puis sur un vrai Android de milieu de gamme**, en mode avion. 10 photos du jeu de test, une photo portrait (EXIF), une photo de 12 Mpx, une photo sans poisson, une photo avec deux poissons.
Expected : temps < 1 s par photo sur le vrai téléphone, résultats identiques à `evaluate.py` pour les 10 photos, comportements du Review Focus conformes. Écran jamais figé.
- [ ] **Step 2 : Taille finale** · même mesure qu'à la tâche 2 · Expected : ajout ≤ 85 Mo.
- [ ] **Step 3 : `docs/SPRINT-7.md`** dans le style des sprints précédents : ce qui change, parcours d'une photo, résultats de précision, comment ajouter une espèce (catalogue, puis `fetch_inat_photos.py`, `build_centroids.py`, `evaluate.py`), règle du disque D:, recompilation nécessaire.
- [ ] **Step 4 : Vérification finale** · `npx tsc --noEmit`, `npx jest`, `npx expo lint`, `python scripts\ml\evaluate.py --pte assets\models --photos .tmp\ml\photos --split test` · tout réussit.
- [ ] **Step 5 : Commit** · `git commit -m "docs: sprint 7, reconnaissance des espèces sur le téléphone"`
