"""Détecteurs de poissons utilisés pour recadrer la photo avant le classifieur.

- `rfdetr` : Community Fish Detector RF-DETR Nano (Apache 2.0), via rfdetr : le détecteur de l'app.
  (Le YOLO26 de Fishial, essayé à la tâche 1, a été retiré le 26/11 : entraîné avec Ultralytics, sous AGPL.)
Renvoie des boîtes en pixels (x0, y0, x1, y1) et un score.
"""
from dataclasses import dataclass

from PIL import Image

DETECTION_THRESHOLD = 0.3
CROP_MARGIN = 0.0  # recadrage au ras de la boîte : le plus précis au test du 26/11 (README)


@dataclass
class Box:
    x0: float
    y0: float
    x1: float
    y1: float
    confidence: float


class Detector:
    name = 'aucun'

    def detect(self, img: Image.Image) -> list[Box]:
        return []

    def parameter_count(self) -> int:
        return 0


class RfDetrDetector(Detector):
    name = 'rfdetr'

    def __init__(self, path: str):
        from rfdetr import from_checkpoint
        self.model = from_checkpoint(path)

    def detect(self, img):
        det = self.model.predict(img, threshold=DETECTION_THRESHOLD)
        return [Box(*b, float(c)) for b, c in zip(det.xyxy.tolist(), det.confidence.tolist())]

    def parameter_count(self):
        inner = getattr(self.model, 'model', None)
        inner = getattr(inner, 'model', inner)
        return sum(p.numel() for p in inner.parameters()) if inner is not None else 0


def make_detector(kind: str | None, path: str | None, size: int = 640) -> Detector:
    if kind is None:
        return Detector()
    if kind != 'rfdetr':
        raise ValueError(f'détecteur inconnu : {kind} (seul rfdetr est disponible)')
    return RfDetrDetector(path)


def best_box(boxes: list[Box], threshold: float = DETECTION_THRESHOLD) -> Box | None:
    """La boîte la plus SÛRE au-dessus du seuil (pas la plus grande, pas la première)."""
    kept = [b for b in boxes if b.confidence >= threshold]
    return max(kept, key=lambda b: b.confidence) if kept else None


def crop_to_box(img: Image.Image, box: Box, margin: float = CROP_MARGIN) -> Image.Image:
    """Recadre sur la boîte (avec une marge éventuelle de chaque côté), sans sortir de l'image."""
    mx, my = margin * (box.x1 - box.x0), margin * (box.y1 - box.y0)
    return img.crop((max(0, box.x0 - mx), max(0, box.y0 - my), min(img.width, box.x1 + mx), min(img.height, box.y1 + my)))
