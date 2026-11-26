"""Détecteur Community Fish Detector RF-DETR Nano (Apache 2.0) sous la forme exportée vers l'app.

Entrée  : float32 [1, 3, S, S], RGB 0..1, photo étirée en S×S (pas de marges grises).
Sortie  : float32 [1, 300, 5] = cx, cy, w, h (fractions de la photo, 0..1) et score (0..1), une ligne par requête.
La normalisation ImageNet et la sigmoïde sont dans le modèle.
"""
import torch

MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)


class RfDetrExport(torch.nn.Module):
    def __init__(self, lwdetr: torch.nn.Module):
        super().__init__()
        self.net = lwdetr
        self.register_buffer('mean', torch.tensor(MEAN).view(1, 3, 1, 1))
        self.register_buffer('std', torch.tensor(STD).view(1, 3, 1, 1))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.net.forward_export((x - self.mean) / self.std)
        boxes, logits = out[0], out[1]
        score = logits.sigmoid().amax(dim=-1, keepdim=True)
        return torch.cat([boxes, score], dim=-1)


def load_rfdetr(path: str, size: int = 640) -> RfDetrExport:
    from rfdetr import from_checkpoint
    m = from_checkpoint(path)
    net = m.model.model.eval()
    net.export()
    return RfDetrExport(net).eval()
