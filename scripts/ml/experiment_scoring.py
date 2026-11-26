"""Expérience (tâche 4) : quelles références et quel score donnent la meilleure précision ?

1. --cache : calcule une fois les empreintes (.pte, comme l'app) de toutes les photos → .npz
2. sans --cache : compare des variantes sur le cache, en quelques secondes.
"""
import argparse, os, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import torch

from photo_sets import decode, load_catalog, load_photos
from scoring import catalog_probabilities


def cache(args):
    from pte_runtime import OnDevicePipeline
    pipeline = OnDevicePipeline(args.pte)
    latin_to_id = {c['latinName']: c['id'] for c in load_catalog(args.catalog)}
    rows = {'emb': [], 'probs': [], 'species': [], 'split': [], 'fish': []}
    for p in load_photos(args.photos):
        emb, probs, box = pipeline.analyze(decode(p))
        rows['emb'].append(emb)
        rows['probs'].append(probs)
        rows['species'].append(p['species'])
        rows['split'].append(p['split'])
        rows['fish'].append(box is not None)
    np.savez_compressed(args.out, **{k: np.array(v) for k, v in rows.items()})


def normalize(m):
    return m / np.linalg.norm(m, axis=-1, keepdims=True)


def evaluate(name, score_fn, data, ids, latin_to_id, unsure_fn=None):
    test = data['split'] == 'test'
    outside = data['split'] == 'outside'
    top1 = top3 = 0
    per = defaultdict(lambda: [0, 0])
    for i in np.flatnonzero(test):
        scores = score_fn(i)
        order = np.argsort(-scores)[:3]
        exp = latin_to_id[data['species'][i]]
        top1 += ids[order[0]] == exp
        top3 += exp in [ids[j] for j in order]
        per[exp][0] += 1
        per[exp][1] += ids[order[0]] == exp
    n = test.sum()
    line = f"{name:52} 1re {top1/n:5.1%}  top3 {top3/n:5.1%}"
    if unsure_fn:
        # Seuil choisi pour que 10 % des photos du catalogue soient « incertaines » : combien d'hors catalogue le sont ?
        vals_in = np.array([unsure_fn(i) for i in np.flatnonzero(test)])
        vals_out = np.array([unsure_fn(i) for i in np.flatnonzero(outside)])
        for q in (0.1, 0.2):
            thr = np.quantile(vals_in, q)
            line += f" | rejet {q:.0%} cat. → {np.mean(vals_out < thr):.0%} hors cat."
    print(line)
    return per


def compare(args):
    data = dict(np.load(args.cache_file, allow_pickle=False))
    catalog = load_catalog(args.catalog)
    ids = [c['id'] for c in catalog]
    latin_to_id = {c['latinName']: c['id'] for c in catalog}
    labels = list(data['labels'])
    emb = normalize(data['emb'].astype(np.float32))
    ref = data['split'] == 'ref'
    ref_ids = np.array([latin_to_id.get(s, '') for s in data['species']])

    # Références : nos photos iNaturalist
    own_centroids = normalize(np.stack([emb[ref & (ref_ids == i)].mean(0) for i in ids]))
    own_ref_emb, own_ref_lab = emb[ref], np.array([ids.index(r) for r in ref_ids[ref]])

    # Références : base Fishial (114 000 empreintes de son entraînement), pour les espèces qu'il connaît
    db = torch.load(os.path.join(args.model, 'database.pt'), map_location='cpu', weights_only=False)
    db_emb = normalize(db['embeddings'].numpy().astype(np.float32))
    db_lab_names = np.array(db['labels'])
    known = [i for i, c in enumerate(catalog) if c['latinName'] in set(db_lab_names)]
    mixed = own_centroids.copy()
    for k in known:
        sel = db_lab_names == catalog[k]['latinName']
        mixed[k] = normalize((db_emb[sel].mean(0) + own_centroids[k] * 0) [None])[0]
    db_sel = np.isin(db_lab_names, [catalog[k]['latinName'] for k in known])
    knn_emb = np.concatenate([own_ref_emb, db_emb[db_sel]])
    knn_lab = np.concatenate([own_ref_lab, np.array([ids.index(latin_to_id[n]) for n in db_lab_names[db_sel]])])
    print(f"Espèces du catalogue connues de la base Fishial : {len(known)}/{len(ids)} ; empreintes Fishial utilisées : {db_sel.sum()}\n")

    head = np.array([[catalog_probabilities(data['probs'][i], labels, latin_to_id).get(c, 0.0) for c in ids] for i in range(len(emb))])
    head = head / np.maximum(head.sum(1, keepdims=True), 1e-9)

    def soft(z):
        z = 30 * z
        e = np.exp(z - z.max())
        return e / e.sum()

    def knn_scores(i, bank, lab, k=10):
        sims = bank @ emb[i]
        top = np.argsort(-sims)[:k]
        s = np.zeros(len(ids))
        for j in top:
            s[lab[j]] += np.exp(30 * (sims[j] - sims[top[0]]))
        return s / s.sum()

    evaluate('A. centroïdes (nos photos)', lambda i: soft(own_centroids @ emb[i]), data, ids, latin_to_id, lambda i: (own_centroids @ emb[i]).max())
    evaluate('A+tête 0,5', lambda i: 0.5 * head[i] + 0.5 * soft(own_centroids @ emb[i]), data, ids, latin_to_id)
    evaluate('B. centroïdes Fishial si connue, sinon nos photos', lambda i: soft(mixed @ emb[i]), data, ids, latin_to_id, lambda i: (mixed @ emb[i]).max())
    evaluate('B+tête 0,5', lambda i: 0.5 * head[i] + 0.5 * soft(mixed @ emb[i]), data, ids, latin_to_id)
    evaluate('C. 10 plus proches voisins (nos photos)', lambda i: knn_scores(i, own_ref_emb, own_ref_lab), data, ids, latin_to_id, lambda i: (own_ref_emb @ emb[i]).max())
    evaluate('D. 10 plus proches voisins (nos photos + Fishial)', lambda i: knn_scores(i, knn_emb, knn_lab), data, ids, latin_to_id, lambda i: (knn_emb @ emb[i]).max())
    evaluate('D+tête 0,5', lambda i: 0.5 * head[i] + 0.5 * knn_scores(i, knn_emb, knn_lab), data, ids, latin_to_id)
    evaluate('tête Fishial seule', lambda i: head[i] + 1e-9 * soft(own_centroids @ emb[i]), data, ids, latin_to_id)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--pte')
    ap.add_argument('--model', help='dossier Fishial v9-2 (database.pt)')
    ap.add_argument('--catalog', required=True)
    ap.add_argument('--photos', nargs='+')
    ap.add_argument('--cache', action='store_true')
    ap.add_argument('--out', default='.tmp/ml/embeddings.npz')
    ap.add_argument('--cache-file', default='.tmp/ml/embeddings.npz')
    a = ap.parse_args()
    cache(a) if a.cache else compare(a)
