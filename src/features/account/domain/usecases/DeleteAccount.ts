import type { AccountDataEraser, PublicContentChoice } from '../ports/AccountDataEraser';
import type { AccountPreferencesRepository } from '../repositories/AccountPreferencesRepository';
import type { AccountRepository } from '../repositories/AccountRepository';

/** Erreur métier : la suppression n'a pas été confirmée (case « Je comprends… » non cochée). */
export class DeletionNotConfirmedError extends Error {
  constructor() {
    super('Confirmez que la suppression est définitive.');
    this.name = 'DeletionNotConfirmedError';
  }
}

export interface DeleteAccountRequest {
  userId: string;
  publicContent: PublicContentChoice;
  /** La personne a coché « Je comprends que la suppression est définitive ». */
  confirmed: boolean;
}

/**
 * CAS D'USAGE : « supprimer mon compte » (obligatoire sur l'App Store et le Play Store, et RGPD).
 * 1. le compte est supprimé côté serveur (si ça échoue, rien n'est effacé sur le téléphone : on peut réessayer) ;
 * 2. les données du téléphone sont effacées (ou anonymisées pour le contenu public, au choix) ;
 * 3. les réglages du compte sont remis à zéro.
 * La déconnexion (vider la session) est faite par l'écran.
 */
export class DeleteAccount {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly eraser: AccountDataEraser,
    private readonly preferences: AccountPreferencesRepository,
  ) {}

  async execute(request: DeleteAccountRequest): Promise<void> {
    if (!request.confirmed) throw new DeletionNotConfirmedError();
    if (!request.userId) throw new Error('Utilisateur non connecté');
    await this.accountRepository.deleteAccount(request.userId);
    await this.eraser.erase(request.userId, request.publicContent);
    await this.preferences.clear();
  }
}
