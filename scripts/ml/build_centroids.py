"""Calcule le centroïde (empreinte moyenne normée) de chaque espèce du catalogue, à partir des photos `ref`.

  python scripts/ml/build_centroids.py --pte assets/models --catalog .tmp/ml/catalog.json \
      --photos ".tmp/ml/photos/*.json" --out assets/models/species-centroids.json

Seules les photos `ref` servent ; les photos `test` restent réservées au contrôle de précision.
Une photo où aucun poisson n'est détecté est ignorée (comptée dans le rapport).
"""
import argparse, json, os, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from photo_sets import decode, load_catalog, load_photos
from pte_runtime import OnDevicePipeline

EMBEDDING_DIM = 256


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--pte', required=True)
    ap.add_argument('--catalog', required=True)
    ap.add_argument('--photos', nargs='+', required=True)
    ap.add_argument('--out', required=True)
    args = ap.parse_args()

    catalog = load_catalog(args.catalog)
    latin_to_id = {c['latinName']: c['id'] for c in catalog}
    pipeline = OnDevicePipeline(args.pte)
    sums, counts, skipped = defaultdict(lambda: np.zeros(EMBEDDING_DIM)), defaultdict(int), defaultdict(int)
    for photo in load_photos(args.photos, split='ref'):
        sid = latin_to_id.get(photo['species'])
        if sid is None:
            continue
        emb, _, box = pipeline.analyze(decode(photo))
        if box is None:
            skipped[sid] += 1
            continue
        sums[sid] += emb
        counts[sid] += 1

    missing = [c['id'] for c in catalog if counts[c['id']] == 0]
    centroids = []
    for c in catalog:
        if counts[c['id']]:
            v = sums[c['id']] / np.linalg.norm(sums[c['id']])
            centroids.append({'id': c['id'], 'vector': [round(float(x), 5) for x in v]})
    json.dump({'version': 1, 'dim': EMBEDDING_DIM, 'centroids': centroids}, open(args.out, 'w'), separators=(',', ':'))

    print(f"{len(centroids)} centroïdes écrits dans {args.out}")
    few = sorted((counts[c['id']], c['id']) for c in catalog if 0 < counts[c['id']] < 10)
    if few:
        print('Peu de photos de référence :', ', '.join(f'{i} ({n})' for n, i in few))
    if skipped:
        print('Photos sans poisson détecté (ignorées) :', sum(skipped.values()))
    if missing:
        print('AUCUNE photo de référence pour :', ', '.join(missing))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
