"""Jeux de photos (JSON) et catalogue de l'app.

Un jeu de photos est un ou plusieurs fichiers JSON : [{species: <nom latin>, split: ref|test|outside, data: <jpeg base64>,
obs, license, attribution}]. `ref` sert aux centroïdes, `test` au contrôle de précision (jamais aux centroïdes),
`outside` = espèces hors catalogue, pour le test « je ne sais pas ».
Le catalogue est le JSON [{id, latinName}] produit par scripts/ml/dump-catalog.ts.
"""
import base64, glob, io, json

from PIL import Image, ImageOps


def load_photos(patterns: list[str], split: str | None = None) -> list[dict]:
    photos = []
    for pattern in patterns:
        for path in sorted(glob.glob(pattern)):
            photos.extend(json.load(open(path)))
    return [p for p in photos if split is None or p.get('split', 'test') == split]


def decode(photo: dict) -> Image.Image:
    """Photo décodée, dans le bon sens (orientation EXIF), en RGB."""
    return ImageOps.exif_transpose(Image.open(io.BytesIO(base64.b64decode(photo['data'])))).convert('RGB')


def load_catalog(path: str) -> list[dict]:
    return json.load(open(path))


def latin_to_id(catalog: list[dict]) -> dict[str, str]:
    """Nom latin → id du catalogue. Un groupe (mulets, lieus, chinchards) reçoit les noms de tous ses membres."""
    mapping = {}
    for c in catalog:
        for name in [c['latinName'], *(c.get('members') or [])]:
            mapping[name] = c['id']
    return mapping
