import type { CatalogItem } from '../../../domain/entities/Catalog';
import type { SpeciesHead } from '../../../domain/recognition/scoreSpecies';
import { EMBEDDING_DIM } from './ExecutorchSpeciesEmbedder';

/** Format de assets/models/species-head.json (scripts/ml/train_head.py). */
export interface SpeciesHeadFile {
  readonly version: number;
  readonly dim: number;
  readonly classIds: readonly string[];
  readonly weights: readonly (readonly number[])[];
  readonly bias: readonly number[];
}

/**
 * Vérifie et renvoie la couche de décision : chaque classe pointe vers une espèce du catalogue,
 * chaque espèce du catalogue a au moins une classe, et les dimensions sont cohérentes.
 * Une incohérence est une erreur de préparation : on la signale plutôt que de proposer n'importe quoi.
 */
export function loadSpeciesHead(file: SpeciesHeadFile, catalog: readonly CatalogItem[]): SpeciesHead {
  if (file.dim !== EMBEDDING_DIM) throw new Error(`Couche de décision de dimension ${file.dim} (attendu ${EMBEDDING_DIM})`);
  const known = new Set(catalog.map((c) => c.id));
  const unknown = file.classIds.filter((id) => !known.has(id));
  if (unknown.length > 0) throw new Error(`Classes hors catalogue : ${unknown.join(', ')}`);
  const covered = new Set(file.classIds);
  const missing = catalog.filter((c) => !covered.has(c.id)).map((c) => c.id);
  if (missing.length > 0) throw new Error(`Espèces sans classe : ${missing.join(', ')}`);
  if (file.weights.length !== file.classIds.length || file.bias.length !== file.classIds.length) {
    throw new Error('Couche de décision incomplète');
  }
  if (file.weights.some((row) => row.length !== EMBEDDING_DIM)) throw new Error('Poids de la mauvaise dimension');
  return { classIds: file.classIds, weights: file.weights, bias: file.bias };
}
