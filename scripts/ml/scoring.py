"""Le score de l'app, en Python : MÊME calcul que src/features/spots/domain/recognition/scoreSpecies.ts.

Une petite couche de décision apprise (train_head.py) transforme l'empreinte en probabilités par espèce :
p = softmax(W · empreinte + b), puis on additionne les probabilités des membres d'un même groupe du catalogue
(mulets, lieus, chinchards). On propose les 3 meilleures ; sous `min_confidence`, « je ne sais pas ».
"""
from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class SpeciesHead:
    class_ids: list[str]  # id du catalogue de chaque classe
    weights: np.ndarray  # [classes, 256]
    bias: np.ndarray  # [classes]

    @staticmethod
    def from_json(data: dict) -> 'SpeciesHead':
        return SpeciesHead(data['classIds'], np.array(data['weights'], dtype=np.float64), np.array(data['bias'], dtype=np.float64))

    @property
    def ids(self) -> list[str]:
        return list(dict.fromkeys(self.class_ids))

    def probabilities(self, embedding: np.ndarray) -> np.ndarray:
        """Probabilités par entrée du catalogue (dans l'ordre de `ids`)."""
        z = self.weights @ embedding + self.bias
        e = np.exp(z - z.max())
        p = e / e.sum()
        ids = self.ids
        out = np.zeros(len(ids))
        for k, cid in enumerate(self.class_ids):
            out[ids.index(cid)] += p[k]
        return out


def score_species(embedding: np.ndarray, head: SpeciesHead, min_confidence: float, max_candidates: int = 3) -> list[tuple[str, float]]:
    """Renvoie les propositions [(id, confiance)] triées, ou [] pour « je ne sais pas »."""
    p = head.probabilities(embedding)
    order = np.argsort(-p)
    if p[order[0]] < min_confidence:
        return []
    return [(head.ids[i], float(p[i])) for i in order[:max_candidates]]
