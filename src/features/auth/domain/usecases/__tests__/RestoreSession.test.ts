import type { User } from '../../entities/User';
import type { AuthRepository } from '../../repositories/AuthRepository';
import { RestoreSession } from '../RestoreSession';

const USER: User = { id: 'u1', displayName: 'Karim B.', photoUrl: null, provider: 'google' };

const repo = (currentUser?: AuthRepository['currentUser']): AuthRepository => ({
  signIn: async () => USER,
  signOut: async () => undefined,
  currentUser,
});

describe('RestoreSession', () => {
  it('reprend l’utilisateur de la session gardée', async () => {
    expect(await new RestoreSession(repo(async () => USER)).execute()).toEqual(USER);
  });

  it('renvoie null sans session, ou quand le dépôt ne garde pas de session', async () => {
    expect(await new RestoreSession(repo(async () => null)).execute()).toBeNull();
    expect(await new RestoreSession(repo()).execute()).toBeNull();
  });

  it('ne bloque jamais le démarrage en cas d’erreur', async () => {
    const failing = repo(async () => {
      throw new Error('stockage abîmé');
    });
    expect(await new RestoreSession(failing).execute()).toBeNull();
  });
});
