import * as WebBrowser from 'expo-web-browser';

import { OAuthCancelledError, readCallbackParams, runOAuthBrowser } from '../oauthBrowser';
import { pathFromSignedUrl } from '../SupabasePhotoStorage';

// jest.mock est remonté avant les imports par Jest.
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('expo-linking', () => ({ createURL: (path: string) => `spotpeche://${path}` }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

describe('readCallbackParams', () => {
  it('lit les jetons après « # » (flux implicite)', () => {
    expect(readCallbackParams('spotpeche://auth/callback#access_token=a%2Bb&refresh_token=r&type=bearer')).toEqual({
      access_token: 'a+b',
      refresh_token: 'r',
      type: 'bearer',
    });
  });

  it('lit le code après « ? » (flux PKCE) et les erreurs', () => {
    expect(readCallbackParams('spotpeche://auth/callback?code=xyz')).toEqual({ code: 'xyz' });
    expect(readCallbackParams('spotpeche://auth/callback?error=access_denied&error_description=Refus+utilisateur')).toEqual({
      error: 'access_denied',
      error_description: 'Refus utilisateur',
    });
  });
});

describe('runOAuthBrowser', () => {
  const open = WebBrowser.openAuthSessionAsync as jest.Mock;

  it('renvoie les paramètres de retour', async () => {
    open.mockResolvedValueOnce({ type: 'success', url: 'spotpeche://auth/callback#access_token=t&refresh_token=r' });
    await expect(runOAuthBrowser('https://example.supabase.co/auth/v1/authorize')).resolves.toMatchObject({ access_token: 't' });
    expect(open).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/authorize', 'spotpeche://auth/callback');
  });

  it('fenêtre fermée → annulation ; erreur du fournisseur → erreur lisible', async () => {
    open.mockResolvedValueOnce({ type: 'cancel' });
    await expect(runOAuthBrowser('u')).rejects.toBeInstanceOf(OAuthCancelledError);
    open.mockResolvedValueOnce({ type: 'success', url: 'spotpeche://auth/callback?error=x&error_description=Compte+bloqué' });
    await expect(runOAuthBrowser('u')).rejects.toThrow('Compte bloqué');
  });
});

describe('pathFromSignedUrl', () => {
  it('retrouve le chemin d’une photo à partir de son adresse signée', () => {
    const url =
      'https://abc.supabase.co/storage/v1/object/sign/spot-photos/0b1c2d3e-0000-4000-8000-000000000001/p1.jpg?token=eyJ';
    expect(pathFromSignedUrl(url)).toBe('0b1c2d3e-0000-4000-8000-000000000001/p1.jpg');
    expect(pathFromSignedUrl('file:///data/photo.jpg')).toBeNull();
  });
});
