/** Une proposition de l'agent IA : un identifiant du catalogue et une confiance entre 0 et 1. */
export interface RecognitionCandidate {
  readonly id: string;
  readonly confidence: number;
}

/** Réponse de la reconnaissance : les propositions, et une courte explication de l'agent. */
export interface RecognitionOutcome {
  readonly candidates: readonly RecognitionCandidate[];
  /** Ex. « Bec de canard, dorsale reculée » ou « Photo trop floue ». */
  readonly note?: string;
}

/**
 * CONTRAT de la reconnaissance d'image : quelle ESPÈCE de poisson est sur cette photo ?
 * (La reconnaissance des appâts a été retirée : on les choisit dans la liste.)
 *
 * Le domaine pose la question sans savoir qui répond :
 * un agent IA derrière un serveur, un modèle embarqué, ou une version de démo.
 */
export interface ImageRecognizer {
  /** true si la photo n'est pas vraiment analysée (démonstration). */
  readonly isDemo: boolean;
  recognize(photoUri: string): Promise<RecognitionOutcome>;
}

/** La photo dépasse la taille acceptée par l'agent. */
export class PhotoTooLargeError extends Error {
  constructor() {
    super('Photo trop lourde');
    this.name = 'PhotoTooLargeError';
  }
}

/** L'agent ne répond pas (pas de réseau, serveur en panne…). */
export class RecognitionUnavailableError extends Error {
  constructor(reason: string) {
    super(`Reconnaissance indisponible : ${reason}`);
    this.name = 'RecognitionUnavailableError';
  }
}
