import type { ImageRecognizer, RecognitionOutcome } from '../../domain/recognition/ImageRecognizer';

/**
 * Reconnaissance de DÉMONSTRATION : elle ne regarde pas vraiment la photo.
 *
 * Elle simule le temps de réponse d'un agent IA et renvoie des propositions fixes,
 * pour pouvoir construire et tester tout le parcours dès maintenant.
 *
 * Utilisée tant que le serveur de l'agent IA n'est pas configuré
 * (EXPO_PUBLIC_SPOT_AI_URL vide) : l'écran affiche alors « Mode démo ».
 * Le vrai agent est `AgentImageRecognizer`.
 */
export class DemoImageRecognizer implements ImageRecognizer {
  readonly isDemo = true;

  constructor(private readonly delayMs = 1200) {}

  async recognize(_photoUri: string): Promise<RecognitionOutcome> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    const candidates = [
      { id: 'brochet', confidence: 0.92 },
      { id: 'sandre', confidence: 0.05 },
      { id: 'blackbass', confidence: 0.02 },
    ];
    return { candidates, note: 'Résultat d’exemple : la photo n’est pas analysée en mode démo.' };
  }
}
