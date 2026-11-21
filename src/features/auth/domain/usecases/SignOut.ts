import type { AuthRepository } from '../repositories/AuthRepository';

/** CAS D'USAGE : « se déconnecter ». */
export class SignOut {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}
