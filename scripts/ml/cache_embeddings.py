"""Calcule une fois les empreintes de toutes les photos avec les .pte (comme l'app) → .npz réutilisable.

  python scripts/ml/cache_embeddings.py --pte assets/models --photos ".tmp/ml/photos/*.json" --out .tmp/ml/embeddings.npz

Ensuite : train_head.py --cache-file … puis app_accuracy.py --cache-file … (quelques secondes au lieu de minutes).
"""
import argparse, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from photo_sets import decode, load_photos
from pte_runtime import OnDevicePipeline


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pte', default='assets/models')
    ap.add_argument('--photos', nargs='+', required=True)
    ap.add_argument('--out', required=True)
    args = ap.parse_args()
    pipeline = OnDevicePipeline(args.pte)
    rows = {'emb': [], 'species': [], 'split': [], 'fish': []}
    for p in load_photos(args.photos):
        emb, _, box = pipeline.analyze(decode(p))
        rows['emb'].append(emb)
        rows['species'].append(p['species'])
        rows['split'].append(p['split'])
        rows['fish'].append(box is not None)
    np.savez_compressed(args.out, **{k: np.array(v) for k, v in rows.items()})
    print(f"{len(rows['emb'])} photos, poisson détecté sur {np.mean(rows['fish']):.0%} → {args.out}")


if __name__ == '__main__':
    main()
