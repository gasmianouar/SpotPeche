import type { CatalogKind } from '../../domain/entities/Catalog';
import type { ImageRecognizer, RecognitionCandidate } from '../../domain/recognition/ImageRecognizer';

/**
 * Reconnaissance de DÉMONSTRATION : elle ne regarde pas vraiment la photo.
 *
 * Elle simule le temps de réponse d'un agent IA et renvoie des propositions fixes,
 * pour pouvoir construire et tester tout le parcours dès maintenant.
 *
 * Le vrai agent IA (un modèle de vision) sera appelé depuis un SERVEUR, jamais
 * directement depuis l'app : sinon la clé d'API serait lisible dans l'application.
 * Il suffira d'écrire une classe `AgentImageRecognizer implements ImageRecognizer`
 * et de la brancher dans core/di/container.ts.
 */
export class DemoImageRecognizer implements ImageRecognizer {
  constructor(private readonly delayMs = 1200) {}

  async recognize(kind: CatalogKind, _photoUri: string): Promise<RecognitionCandidate[]> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return kind === 'species'
      ? [
          { id: 'brochet', confidence: 0.92 },
          { id: 'sandre', confidence: 0.05 },
          { id: 'blackbass', confidence: 0.02 },
        ]
      : [
          { id: 'shad', confidence: 0.88 },
          { id: 'crank', confidence: 0.09 },
          { id: 'spoon', confidence: 0.03 },
        ];
  }
}
