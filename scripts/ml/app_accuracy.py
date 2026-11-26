"""CONTRÔLE OBLIGATOIRE de la reconnaissance, avec le calcul exact de l'app (fichiers .pte + couche de décision).

  python scripts/ml/app_accuracy.py --pte assets/models --catalog .tmp/ml/catalog.json --photos ".tmp/ml/photos/*.json"
  (ou --cache-file .tmp/ml/embeddings.npz pour réutiliser des empreintes déjà calculées)

Évalue les photos `test` (jamais utilisées pour apprendre) et `outside` (espèces hors catalogue).
Seuils (décision du 24/11) : 1re réponse ≥ 70 %, top 3 ≥ 85 %. Un « je ne sais pas » compte comme une erreur.
La part d'espèces hors catalogue marquées « je ne sais pas » est mesurée, sans seuil : le modèle ne sait pas
la garantir, l'écran présente donc toujours des propositions « à vérifier » et la liste.
Code de sortie 1 si un seuil n'est pas atteint.
"""
import argparse, json, os, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from photo_sets import latin_to_id, load_catalog
from scoring import SpeciesHead, score_species

MIN_TOP1, MIN_TOP3 = 0.70, 0.85
DEFAULT_MIN_CONFIDENCE = 0.15


def embeddings(args):
    if args.cache_file:
        d = np.load(args.cache_file)
        keep = d['split'] != 'ref'
        return d['emb'][keep], list(d['species'][keep]), list(d['split'][keep])
    from photo_sets import decode, load_photos
    from pte_runtime import OnDevicePipeline
    pipeline = OnDevicePipeline(args.pte)
    photos = load_photos(args.photos, 'test') + load_photos(args.photos, 'outside')
    embs = [pipeline.analyze(decode(p))[0] for p in photos]
    return np.array(embs), [p['species'] for p in photos], [p['split'] for p in photos]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--pte', default='assets/models')
    ap.add_argument('--catalog', required=True)
    ap.add_argument('--photos', nargs='+')
    ap.add_argument('--cache-file')
    ap.add_argument('--head', help='par défaut : <pte>/species-head.json')
    ap.add_argument('--min-confidence', type=float, default=DEFAULT_MIN_CONFIDENCE)
    args = ap.parse_args()

    mapping = latin_to_id(load_catalog(args.catalog))
    head = SpeciesHead.from_json(json.load(open(args.head or os.path.join(args.pte, 'species-head.json'))))
    embs, species, splits = embeddings(args)
    embs = embs / np.linalg.norm(embs, axis=1, keepdims=True)

    per = defaultdict(lambda: {'n': 0, 'top1': 0, 'top3': 0, 'unsure': 0, 'errors': defaultdict(int)})
    for emb, sp, split in zip(embs, species, splits):
        top = [c[0] for c in score_species(emb, head, args.min_confidence)]
        key = mapping.get(sp, sp) if split == 'test' else sp
        s = per[(key, split)]
        s['n'] += 1
        s['unsure'] += not top
        if split == 'test':
            s['top1'] += bool(top) and top[0] == key
            s['top3'] += key in top
            if top and top[0] != key:
                s['errors'][top[0]] += 1

    print(f"{'Espèce (id du catalogue)':30} {'n':>3} {'1re':>5} {'top3':>5} {'incert.':>7}  erreurs fréquentes")
    tot = defaultdict(int)
    for (key, split), s in sorted(per.items()):
        errs = ', '.join(f'{k} ×{v}' for k, v in sorted(s['errors'].items(), key=lambda kv: -kv[1])[:2])
        if split == 'test':
            for k in ('n', 'top1', 'top3', 'unsure'):
                tot[k] += s[k]
            print(f"{key:30} {s['n']:>3} {s['top1']/s['n']:>5.0%} {s['top3']/s['n']:>5.0%} {s['unsure']/s['n']:>7.0%}  {errs}")
        else:
            tot['out_n'] += s['n']
            tot['out_unsure'] += s['unsure']
            print(f"{key + ' (hors cat.)':30} {s['n']:>3} {'':>5} {'':>5} {s['unsure']/s['n']:>7.0%}")
    top1, top3 = tot['top1'] / tot['n'], tot['top3'] / tot['n']
    ok = top1 >= MIN_TOP1 and top3 >= MIN_TOP3
    print(f"\nTOTAL ({tot['n']} photos, seuil de confiance {args.min_confidence}) : 1re réponse {top1:.1%} (≥ {MIN_TOP1:.0%}) · "
          f"top 3 {top3:.1%} (≥ {MIN_TOP3:.0%}) · « je ne sais pas » : {tot['unsure']/tot['n']:.0%} du catalogue, "
          f"{tot['out_unsure']/max(tot['out_n'], 1):.0%} hors catalogue → {'OK' if ok else 'ÉCHEC'}")
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
