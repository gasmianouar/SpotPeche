"""Modèle d'empreinte Fishial ConvNeXt Tiny (v9.2), repris de son inference.py (licence MIT).

Charge les poids « EMA » (moyenne glissante) comme le fait Fishial.
"""
import os

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import convnext_tiny

EMBEDDING_DIM = 256
NUM_CLASSES = 639
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


class AttentionPooling(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.attention_conv = nn.Conv2d(channels, 1, 1)

    def forward(self, x):
        w = torch.sigmoid(self.attention_conv(x))
        return (x * w).sum(dim=(2, 3)) / w.sum(dim=(2, 3)).clamp(min=1e-6)


class ArcFaceHead(nn.Module):
    def __init__(self, dim: int, classes: int):
        super().__init__()
        self.weight = nn.Parameter(torch.zeros(classes, dim))

    def forward(self, emb):
        return F.linear(F.normalize(emb), F.normalize(self.weight)) * 30.0


class StableEmbeddingModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = convnext_tiny(weights=None)
        self.pooling = AttentionPooling(768)
        self.embeddings = nn.Linear(768, EMBEDDING_DIM)
        self.fc_parallel = nn.Linear(768, NUM_CLASSES)
        self.arcface = ArcFaceHead(EMBEDDING_DIM, NUM_CLASSES)

    def forward(self, x):
        pooled = self.pooling(self.backbone.features(x))
        emb = F.normalize(self.embeddings(pooled), dim=1)
        return emb, F.softmax(self.arcface(emb), 1), F.softmax(self.fc_parallel(pooled), 1)


class SpeciesEmbedder(nn.Module):
    """Ce qui est exporté vers le téléphone : image RGB 0..1 (224×224) → (empreinte 256, probabilités 639).

    La normalisation ImageNet est faite DANS le modèle : l'app n'a qu'à redimensionner.
    """

    def __init__(self, core: StableEmbeddingModel):
        super().__init__()
        self.core = core
        self.register_buffer('mean', torch.tensor(IMAGENET_MEAN).view(1, 3, 1, 1))
        self.register_buffer('std', torch.tensor(IMAGENET_STD).view(1, 3, 1, 1))

    def forward(self, x):
        emb, arc, fc = self.core((x - self.mean) / self.std)
        return emb, (arc + fc) / 2


def load_fishial(model_dir: str) -> tuple[SpeciesEmbedder, list[str]]:
    """Charge le modèle (poids EMA) et la liste des 639 noms latins, à l'indice de chaque classe."""
    ckpt = torch.load(os.path.join(model_dir, 'model.ckpt'), map_location='cpu', weights_only=False)
    core = StableEmbeddingModel()
    core.load_state_dict(ckpt['model_state_dict'])
    params = list(core.parameters())
    shadow = ckpt['ema_state_dict']['shadow_params']
    assert len(params) == len(shadow), 'poids EMA incompatibles'
    with torch.no_grad():
        for p, s in zip(params, shadow):
            p.copy_(s)
    db = torch.load(os.path.join(model_dir, 'database.pt'), map_location='cpu', weights_only=False)
    keys = db['labels_keys']
    labels = [keys[i]['label'] for i in range(NUM_CLASSES)]
    return SpeciesEmbedder(core).eval(), labels
