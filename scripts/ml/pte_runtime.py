"""Fait tourner les .pte exportés, exactement comme l'app le fera (même prétraitement, même lecture des sorties).

Détecteur (Community Fish Detector, RF-DETR Nano, Apache 2.0) : entrée [1, 3, S, S] RGB 0..1, photo étirée en S×S ;
sortie [1, 300, 5] = cx, cy, w, h en fractions de la photo et score. L'app n'a besoin que de la boîte la plus sûre :
pas de NMS, on prend le score maximal.
"""
import numpy as np
import torch
from PIL import Image

from detectors import Box, DETECTION_THRESHOLD


def stretch(img: Image.Image, size: int) -> torch.Tensor:
    """Photo étirée en size×size (bilinéaire), float32 [1, 3, size, size] RGB 0..1."""
    arr = np.asarray(img.convert('RGB').resize((size, size), Image.BILINEAR), dtype=np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).contiguous()


MAIN_FISH_RATIO = 0.6  # décision du 26/11 (README) : le plus grand poisson parmi les plus sûrs


def decode_best_box(raw: np.ndarray, width: int, height: int, threshold: float = DETECTION_THRESHOLD) -> Box | None:
    """raw : [N, 5] (cx, cy, w, h en fractions, score). Le poisson principal, en pixels de la photo d'origine :
    parmi les boîtes dont le score atteint 60 % du meilleur (et le seuil), la plus grande. Sur une photo de prise,
    c'est le poisson montré ; le score maximal seul tombait souvent sur un petit poisson du fond."""
    top = float(raw[:, 4].max()) if len(raw) else 0.0
    if top < threshold:
        return None
    cand = raw[raw[:, 4] >= max(threshold, MAIN_FISH_RATIO * top)]
    cx, cy, w, h, score = (float(v) for v in cand[int(np.argmax(cand[:, 2] * cand[:, 3]))])
    return Box((cx - w / 2) * width, (cy - h / 2) * height, (cx + w / 2) * width, (cy + h / 2) * height, score)


class PteModel:
    def __init__(self, path: str):
        from executorch.runtime import Runtime
        self.method = Runtime.get().load_program(path).load_method('forward')

    def __call__(self, x: torch.Tensor):
        return self.method.execute([x])


class PteDetector:
    name = 'rfdetr (.pte)'

    def __init__(self, path: str):
        self.model = PteModel(path)
        self.size = int(self.model.method.metadata.input_tensor_meta(0).sizes()[-1])

    def best(self, img: Image.Image) -> Box | None:
        return decode_best_box(self.model(stretch(img, self.size))[0][0].numpy(), img.width, img.height)


def to_embedder_input(img: Image.Image) -> torch.Tensor:
    """Image recadrée → float32 [1, 3, 224, 224], RGB 0..1, étirée en bilinéaire (comme l'app)."""
    arr = np.asarray(img.resize((224, 224), Image.BILINEAR), dtype=np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).contiguous()


class OnDevicePipeline:
    """Le parcours d'une photo dans l'app : détection → recadrage → empreinte et probabilités (fichiers .pte)."""

    def __init__(self, pte_dir: str):
        import json, os
        from detectors import crop_to_box
        self._crop = crop_to_box
        self.detector = PteDetector(os.path.join(pte_dir, 'fish-detector.pte'))
        self.embedder = PteModel(os.path.join(pte_dir, 'species-embedder.pte'))

    def analyze(self, img: Image.Image):
        """Renvoie (empreinte [256], probabilités [639], boîte ou None)."""
        box = self.detector.best(img)
        emb, probs = self.embedder(to_embedder_input(self._crop(img, box) if box else img))
        return emb[0].numpy(), probs[0].numpy(), box
