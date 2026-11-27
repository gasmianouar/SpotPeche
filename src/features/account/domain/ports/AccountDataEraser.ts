/** Ce que deviennent les spots publics et les messages quand le compte est supprimé. */
export type PublicContentChoice = 'delete' | 'anonymize';

/**
 * PORT : « efface les données de cette personne sur le téléphone ».
 * Toujours supprimés : spots privés, avis « ça mord ? », réactions, blocages, signalements.
 * Spots publics et messages : supprimés, ou gardés sans nom selon `publicContent`.
 */
export interface AccountDataEraser {
  erase(userId: string, publicContent: PublicContentChoice): Promise<void>;
}
