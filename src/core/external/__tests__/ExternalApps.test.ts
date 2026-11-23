import { NativeExternalApps, type PhoneLinks } from '../ExternalApps';

const SPOT = { latitude: 48.7803, longitude: 2.4455 };

/** Un faux téléphone : `installed` liste les schémas des apps installées. */
function fakePhone(installed: string[]) {
  const opened: string[] = [];
  const shared: string[] = [];
  const phone: PhoneLinks = {
    openURL: async (url) => {
      const scheme = url.split(':')[0];
      if (scheme !== 'https' && !installed.includes(scheme)) throw new Error('Aucune app');
      opened.push(url);
    },
    shareSheet: async (message) => {
      shared.push(message);
    },
  };
  return { phone, opened, shared };
}

describe('NativeExternalApps', () => {
  it('ouvre Waze avec la navigation depuis la position actuelle', async () => {
    const { phone, opened } = fakePhone(['waze']);
    await new NativeExternalApps(phone).openDirections(SPOT, 'waze');
    expect(opened).toEqual(['waze://?ll=48.780300,2.445500&navigate=yes']);
  });

  it('sans Waze installé, ouvre la page Waze', async () => {
    const { phone, opened } = fakePhone([]);
    await new NativeExternalApps(phone).openDirections(SPOT, 'waze');
    expect(opened).toEqual(['https://waze.com/ul?ll=48.780300,2.445500&navigate=yes']);
  });

  it('ouvre Google Maps (app sur iPhone) avec l’itinéraire depuis la position actuelle', async () => {
    const { phone, opened } = fakePhone(['comgooglemaps']);
    await new NativeExternalApps(phone).openDirections(SPOT, 'google-maps');
    expect(opened).toEqual(['comgooglemaps://?daddr=48.780300,2.445500&directionsmode=driving']);
  });

  it('sinon, passe par le lien Google Maps « https »', async () => {
    const { phone, opened } = fakePhone([]);
    await new NativeExternalApps(phone).openDirections(SPOT, 'google-maps');
    expect(opened).toEqual(['https://www.google.com/maps/dir/?api=1&destination=48.780300,2.445500']);
  });

  it('partage le message complet dans WhatsApp', async () => {
    const { phone, opened } = fakePhone(['whatsapp']);
    const outcome = await new NativeExternalApps(phone).shareTo('whatsapp', 'Salut 📍', 'https://lien');
    expect(outcome).toBe('app');
    expect(opened).toEqual([`whatsapp://send?text=${encodeURIComponent('Salut 📍')}`]);
  });

  it('sans WhatsApp, passe par wa.me', async () => {
    const { phone, opened } = fakePhone([]);
    const outcome = await new NativeExternalApps(phone).shareTo('whatsapp', 'Salut', 'https://lien');
    expect(outcome).toBe('fallback');
    expect(opened[0]).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it('partage le lien dans Messenger, ou ouvre la feuille de partage sans Messenger', async () => {
    const withApp = fakePhone(['fb-messenger']);
    await new NativeExternalApps(withApp.phone).shareTo('messenger', 'Salut', 'https://lien');
    expect(withApp.opened).toEqual([`fb-messenger://share?link=${encodeURIComponent('https://lien')}`]);

    const without = fakePhone([]);
    const outcome = await new NativeExternalApps(without.phone).shareTo('messenger', 'Salut', 'https://lien');
    expect(outcome).toBe('fallback');
    expect(without.shared).toEqual(['Salut']);
  });

  it('« Autres » ouvre la feuille de partage du téléphone', async () => {
    const { phone, shared } = fakePhone([]);
    await new NativeExternalApps(phone).shareTo('other', 'Salut', 'https://lien');
    expect(shared).toEqual(['Salut']);
  });
});
