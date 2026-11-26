import type { RecognitionOutcome } from './ImageRecognizer';

/**
 * SCORE de la reconnaissance embarquée (logique métier pure, testée sans téléphone).
 *
 * Le modèle sur le téléphone donne une EMPREINTE de la photo recadrée (256 nombres). Une petite couche
 * de décision, apprise hors ligne sur des photos de référence (scripts/ml/train_head.py), la transforme
 * en probabilités : p = softmax(W · empreinte + b), une classe par espèce. Les espèces d'un même groupe
 * du catalogue (mulets, lieus, chinchards) voient leurs probabilités additionnées.
 * C'est exactement le calcul de scripts/ml/scoring.py, contrôlé par app_accuracy.py.
 */
export interface SpeciesHead {
  /** Id du catalogue de chaque classe (plusieurs classes peuvent partager un id : un groupe). */
  readonly classIds: readonly string[];
  /** Une ligne de 256 poids par classe. */
  readonly weights: readonly (readonly number[])[];
  readonly bias: readonly number[];
}

export interface ScoreInput {
  /** Empreinte de la photo, normée (longueur 1). */
  readonly embedding: readonly number[];
  readonly head: SpeciesHead;
}

export interface ScoreOptions {
  /** En dessous de cette confiance pour la meilleure espèce : « je ne sais pas ». */
  readonly minConfidence: number;
  readonly maxCandidates: number;
}

/**
 * Calibré au contrôle du 24/11 (scripts/ml/README.md) : 72,6 % en 1re réponse, 85,5 % dans les 3 premières,
 * « je ne sais pas » pour 1 % des photos du catalogue.
 */
export const DEFAULT_SCORE_OPTIONS: ScoreOptions = { minConfidence: 0.1, maxCandidates: 3 };

export const UNSURE_NOTE = 'Poisson non reconnu : il n’est peut-être pas dans le catalogue. Choisissez dans la liste.';

export function scoreSpecies({ embedding, head }: ScoreInput, options: ScoreOptions = DEFAULT_SCORE_OPTIONS): RecognitionOutcome {
  const logits = head.weights.map((row, k) => row.reduce((sum, w, i) => sum + w * (embedding[i] ?? 0), head.bias[k] ?? 0));
  const max = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - max));
  const total = exps.reduce((a, b) => a + b, 0);

  const byId = new Map<string, number>();
  head.classIds.forEach((id, k) => byId.set(id, (byId.get(id) ?? 0) + exps[k] / total));
  const scored = [...byId].map(([id, confidence]) => ({ id, confidence })).sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0 || scored[0].confidence < options.minConfidence) return { candidates: [], note: UNSURE_NOTE };
  return { candidates: scored.slice(0, options.maxCandidates) };
}
