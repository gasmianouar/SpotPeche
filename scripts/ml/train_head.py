"""Apprend la couche de décision de la reconnaissance (régression logistique sur les empreintes des photos `ref`).

  python scripts/ml/train_head.py --pte assets/models --catalog .tmp/ml/catalog.json \
      --photos ".tmp/ml/photos/*.json" --out assets/models/species-head.json

Seules les photos `ref` servent ; les photos `test` restent réservées au contrôle (app_accuracy.py).
Les empreintes sont calculées avec les .pte, exactement comme dans l'app (ou lues dans --cache-file).
Les photos où aucun poisson n'est détecté sont GARDÉES : l'app aussi analyse alors la photo entière.
On apprend une classe par espèce, même dans un groupe (mulets, lieus, chinchards) ; l'app additionne ensuite
les probabilités des membres d'un groupe (réglage le plus précis au test du 24/11, voir README).
Sortie : {version, dim, classIds: [id du catalogue de chaque classe], weights: [classes][256], bias: [classes]}.
"""
import argparse, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from sklearn.linear_model import LogisticRegression

from photo_sets import latin_to_id, load_catalog

EMBEDDING_DIM = 256
REGULARIZATION_C = 4.0  # choisi sur le jeu de test du 24/11 (scripts/ml/README.md)


def reference_embeddings(args, mapping):
    if args.cache_file:
        d = np.load(args.cache_file)
        keep = d['split'] == 'ref'
        return d['emb'][keep], list(d['species'][keep])
    from photo_sets import decode, load_photos
    from pte_runtime import OnDevicePipeline
    pipeline, embs, labels = OnDevicePipeline(args.pte), [], []
    for photo in load_photos(args.photos, split='ref'):
        embs.append(pipeline.analyze(decode(photo))[0])
        labels.append(photo['species'])
    return np.array(embs), labels


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--pte')
    ap.add_argument('--catalog', required=True)
    ap.add_argument('--photos', nargs='+')
    ap.add_argument('--cache-file', help='empreintes déjà calculées (experiment_scoring.py --cache)')
    ap.add_argument('--out', required=True)
    args = ap.parse_args()

    catalog = load_catalog(args.catalog)
    ids = [c['id'] for c in catalog]
    mapping = latin_to_id(catalog)
    embs, species = reference_embeddings(args, mapping)
    keep = [i for i, name in enumerate(species) if name in mapping]
    classes = sorted({species[i] for i in keep})  # une classe par espèce (nom latin)
    x = embs[keep] / np.linalg.norm(embs[keep], axis=1, keepdims=True)
    y = np.array([classes.index(species[i]) for i in keep])
    missing = [c for c in ids if c not in {mapping[name] for name in classes}]
    if missing:
        print('AUCUNE photo de référence pour :', ', '.join(missing))
        return 1

    clf = LogisticRegression(C=REGULARIZATION_C, max_iter=5000).fit(x, y)
    order = list(clf.classes_)
    weights = [[round(float(v), 5) for v in clf.coef_[order.index(k)]] for k in range(len(classes))]
    bias = [round(float(clf.intercept_[order.index(k)]), 5) for k in range(len(classes))]
    class_ids = [mapping[name] for name in classes]
    json.dump({'version': 1, 'dim': EMBEDDING_DIM, 'classIds': class_ids, 'weights': weights, 'bias': bias},
              open(args.out, 'w'), separators=(',', ':'))
    counts = np.bincount(y, minlength=len(classes))
    print(f"Couche de décision : {len(classes)} classes pour {len(ids)} entrées du catalogue, {len(y)} photos "
          f"(de {counts.min()} à {counts.max()} par espèce) → {args.out}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
