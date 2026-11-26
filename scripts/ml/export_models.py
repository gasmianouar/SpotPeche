"""Exporte les modèles embarqués dans l'app (format ExecuTorch .pte, backend XNNPACK).

  python scripts/ml/export_models.py --classifier .tmp/ml/models/v9-2 \
      --detector .tmp/ml/models/cfd-rf-detr-nano-640.pth --int8 --out assets/models

Produit :
  species-embedder.pte  entrée float32 [1,3,224,224] RGB 0..1 → (empreinte [1,256] normée, probabilités [1,639])
  fish-detector.pte     entrée float32 [1,3,S,S] RGB 0..1 (photo étirée) → [1,300,5] cx,cy,w,h (fractions), score
                        (Community Fish Detector RF-DETR Nano, Apache 2.0 ; voir README)
Avec --int8 : empreinte et détecteur en int8 dynamique (poids int8 des couches linéaires, activations float).
"""
import argparse, base64, io, json, os, shutil, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import torch
from PIL import Image, ImageOps

from detectors import best_box, crop_to_box, make_detector
from evaluate import to_tensor
from fishial_model import load_fishial

DETECTOR_SIZE = 384
DETECTOR_FLOAT = ('net.bbox_embed', 'net.class_embed')  # petites têtes finales (boîtes, score) laissées en float


def calibration_batches(photos_path: str, detector, limit: int = 64):
    """Les photos de calibration, recadrées comme dans l'app."""
    for p in json.load(open(photos_path))[:limit]:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(base64.b64decode(p['data'])))).convert('RGB')
        box = best_box(detector.detect(img))
        yield to_tensor(crop_to_box(img, box) if box else img)


def export_embedder(model_dir: str, out_dir: str, int8: bool, calibration: str | None, detector_path: str | None):
    from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner
    from executorch.exir import to_edge_transform_and_lower

    model, labels = load_fishial(model_dir)
    example = (torch.rand(1, 3, 224, 224),)
    exported = torch.export.export(model, example)
    if int8:
        exported = quantize(model, example, [example[0]], dynamic=True)  # un passage suffit : seuls les poids sont observés
    program = to_edge_transform_and_lower(exported, partitioner=[XnnpackPartitioner()]).to_executorch()
    path = os.path.join(out_dir, 'species-embedder.pte')
    with open(path, 'wb') as f:
        program.write_to_file(f)
    json.dump(labels, open(os.path.join(out_dir, 'species-labels.json'), 'w'), ensure_ascii=False)
    return path


def lower_and_save(exported, path: str) -> str:
    from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner
    from executorch.exir import to_edge_transform_and_lower

    program = to_edge_transform_and_lower(exported, partitioner=[XnnpackPartitioner()]).to_executorch()
    with open(path, 'wb') as f:
        program.write_to_file(f)
    return path


def quantize(module, example, batches, dynamic: bool = False, keep_float: tuple[str, ...] = ()):
    """int8 PT2E. dynamic=True : poids int8, activations float (un passage suffit).
    keep_float : noms de sous-modules laissés en float (ex. les têtes du détecteur)."""
    from executorch.backends.xnnpack.quantizer.xnnpack_quantizer import (
        XNNPACKQuantizer, get_symmetric_quantization_config)
    from torchao.quantization.pt2e.quantize_pt2e import convert_pt2e, prepare_pt2e

    config = get_symmetric_quantization_config(is_per_channel=True, is_dynamic=dynamic)
    # En dynamique, XNNPACK ne quantifie que les couches linéaires (ConvNeXt en est surtout fait).
    quantizer = XNNPACKQuantizer()
    if dynamic:
        quantizer.set_module_type(torch.nn.Linear, config)
    else:
        quantizer.set_global(config)
    if keep_float:
        def outside(node) -> bool:
            stack = node.meta.get('nn_module_stack') or {}
            return not any(path == k or path.startswith(k + '.') for path, _ in stack.values() for k in keep_float)
        quantizer.set_filter_function(outside)
    prepared = prepare_pt2e(torch.export.export(module, example).module(), quantizer)
    with torch.no_grad():
        for batch in batches:
            prepared(batch)
    return torch.export.export(convert_pt2e(prepared), example)


def export_detector(path: str, out_dir: str, int8: bool, size: int = DETECTOR_SIZE) -> str:
    """RF-DETR Nano. Les constantes (masques, plongements de position interpolés) sont repliées avant
    l'export : sans cela, elles sont recalculées hors XNNPACK à chaque photo (deux fois plus lent)."""
    from executorch.exir.passes.constant_prop_pass import constant_prop_pass
    from rfdetr_module import load_rfdetr

    module = load_rfdetr(path)
    example = (torch.rand(1, 3, size, size),)
    exported = torch.export.export(constant_prop_pass(torch.export.export(module, example)).module(), example)
    if int8:
        exported = quantize(exported.module(), example, [example[0]], dynamic=True, keep_float=DETECTOR_FLOAT)
    else:
        exported = constant_prop_pass(exported)
    return lower_and_save(exported, os.path.join(out_dir, 'fish-detector.pte'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--classifier', required=True)
    ap.add_argument('--detector', required=True)
    ap.add_argument('--calibration', help='photos JSON (non utilisé en int8 dynamique)')
    ap.add_argument('--detector-size', type=int, default=DETECTOR_SIZE)
    ap.add_argument('--int8', action='store_true')
    ap.add_argument('--out', default='assets/models')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    for p in (export_embedder(args.classifier, args.out, args.int8, args.calibration, args.detector),
              export_detector(args.detector, args.out, args.int8, args.detector_size)):
        print(f'{p} : {os.path.getsize(p)/1e6:.1f} Mo')


if __name__ == '__main__':
    main()
