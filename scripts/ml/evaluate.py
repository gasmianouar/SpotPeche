"""Contrôle de précision de la reconnaissance d'espèce, hors app.

Exemples :
  python scripts/ml/evaluate.py --model .tmp/ml/models/v9-2 --photos .tmp/fishial/spot-test-photos.json \
      --detector yolo .tmp/ml/models/detector_v26_n3/model.pt --catalog .tmp/ml/catalog.json

Le jeu de photos est un JSON [{species: <nom latin>, data: <jpeg en base64>, ...}].
Le catalogue est un JSON [{id, latinName}] : seules ses espèces peuvent être proposées.
Code de sortie 1 si la précision est sous les seuils (--min-top1, --min-top3).
"""
import argparse, base64, io, json, os, sys, time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # modules voisins, même avec python -I

import numpy as np
import torch
from PIL import Image, ImageOps

from detectors import best_box, crop_to_box, make_detector
from fishial_model import load_fishial

UNSURE_MIN_PROBABILITY = 0.35


def to_tensor(img: Image.Image) -> torch.Tensor:
    """RGB 0..1, 224×224, comme l'app le fera (la normalisation est dans le modèle)."""
    arr = np.asarray(img.resize((224, 224), Image.BILINEAR), dtype=np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True, help='dossier Fishial v9-2 (model.ckpt, database.pt)')
    ap.add_argument('--photos', required=True)
    ap.add_argument('--detector', nargs=2, metavar=('TYPE', 'CHEMIN'), help='yolo|rfdetr et chemin des poids')
    ap.add_argument('--det-size', type=int, default=640, help='taille d\'entrée du détecteur YOLO (pixels)')
    ap.add_argument('--catalog', help='JSON [{id, latinName}] ; sans lui, les 639 espèces Fishial')
    ap.add_argument('--pte', help='dossier des .pte exportés : évalue species-embedder.pte et fish-detector.pte')
    ap.add_argument('--min-top1', type=float, default=0.0)
    ap.add_argument('--min-top3', type=float, default=0.0)
    args = ap.parse_args()

    model, labels = load_fishial(args.model)
    detector = make_detector(*(args.detector or (None, None)), size=args.det_size)
    if args.pte:
        from pte_runtime import PteDetector, PteModel
        pte_embedder = PteModel(os.path.join(args.pte, 'species-embedder.pte'))
        model = lambda x: tuple(pte_embedder(x))
        pte_detector = PteDetector(os.path.join(args.pte, 'fish-detector.pte'))
        detector.name, detector.detect = pte_detector.name, lambda img: [b for b in [pte_detector.best(img)] if b]
    mask = np.ones(len(labels), bool)
    if args.catalog:
        wanted = {c['latinName'] for c in json.load(open(args.catalog))}
        mask = np.array([name in wanted for name in labels])
    known = {labels[i] for i in np.flatnonzero(mask)}

    stats = defaultdict(lambda: {'n': 0, 'top1': 0, 'top3': 0, 'unsure': 0, 'errors': defaultdict(int)})
    cropped, det_ms, cls_ms = 0, [], []
    photos = json.load(open(args.photos))
    for p in photos:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(base64.b64decode(p['data'])))).convert('RGB')
        t = time.perf_counter()
        box = best_box(detector.detect(img))
        det_ms.append(1000 * (time.perf_counter() - t))
        if box:
            img, cropped = crop_to_box(img, box), cropped + 1
        t = time.perf_counter()
        with torch.no_grad():
            _, probs = model(to_tensor(img))
        cls_ms.append(1000 * (time.perf_counter() - t))
        probs = np.where(mask, probs[0].numpy(), 0)
        probs = probs / probs.sum()
        top = [labels[i] for i in np.argsort(-probs)[:3]]
        s = stats[p['species']]
        s['n'] += 1
        s['top1'] += top[0] == p['species']
        s['top3'] += p['species'] in top
        s['unsure'] += probs.max() < UNSURE_MIN_PROBABILITY
        if top[0] != p['species']:
            s['errors'][top[0]] += 1

    print(f"Détecteur : {detector.name} ({detector.parameter_count()/1e6:.1f} M paramètres) · recadrées : {cropped}/{len(photos)}")
    print(f"Temps CPU moyen : détection {np.mean(det_ms):.0f} ms, classification {np.mean(cls_ms):.0f} ms\n")
    print(f"{'Espèce':28} {'n':>3} {'1re':>5} {'top3':>5} {'incert.':>7}  erreurs fréquentes")
    tot = defaultdict(int)
    for sp, s in sorted(stats.items()):
        errs = ', '.join(f'{k} ×{v}' for k, v in sorted(s['errors'].items(), key=lambda kv: -kv[1])[:2])
        tag = '' if sp in known else ' (hors cat.)'
        print(f"{sp + tag:28} {s['n']:>3} {s['top1']/s['n']:>5.0%} {s['top3']/s['n']:>5.0%} {s['unsure']/s['n']:>7.0%}  {errs}")
        if sp in known:
            for k in ('n', 'top1', 'top3'):
                tot[k] += s[k]
    top1, top3 = tot['top1'] / tot['n'], tot['top3'] / tot['n']
    print(f"\nTOTAL ({tot['n']} photos d'espèces du catalogue) : 1re réponse {top1:.0%} · top 3 {top3:.0%}")
    return 0 if top1 >= args.min_top1 and top3 >= args.min_top3 else 1


if __name__ == '__main__':
    sys.exit(main())
