import { aSpot } from '../../../testing/spotTestData';
import { quoteOf } from '../../entities/SpotMessage';
import { googleMapsDirectionsUrl, openStreetMapUrl, spotShareText, wazeNavigationUrl } from '../spotLinks';

describe('liens et textes du spot', () => {
  it('fabrique un lien OpenStreetMap vers le point', () => {
    expect(openStreetMapUrl({ latitude: 48.7812, longitude: 2.4455 })).toBe(
      'https://www.openstreetmap.org/?mlat=48.781200&mlon=2.445500#map=16/48.781200/2.445500',
    );
  });

  it('fabrique un lien Waze qui lance la navigation depuis la position actuelle', () => {
    expect(wazeNavigationUrl({ latitude: 48.7803, longitude: 2.4455 })).toBe(
      'https://waze.com/ul?ll=48.780300,2.445500&navigate=yes',
    );
  });

  it('partage le créateur, les espèces, la position, Google Maps, Waze et la carte', () => {
    const spot = aSpot();
    const text = spotShareText(spot, [{ id: 'brochet', name: 'Brochet' }]);

    expect(text).toContain(spot.ownerName);
    expect(text).toContain('Espèces : Brochet');
    expect(text).toContain('GPS : ');
    expect(text).toContain(googleMapsDirectionsUrl(spot.coordinates));
    expect(text).toContain(wazeNavigationUrl(spot.coordinates));
    expect(text).toContain('openstreetmap.org');
  });

  it('cite un message en le raccourcissant, ou indique une photo', () => {
    const author = { id: 'u1', name: 'Léa M.', photoUrl: null };
    const long = quoteOf({ id: 'm1', author, text: 'a '.repeat(60), photoUris: [] });
    expect(long.excerpt.length).toBe(80);
    expect(long.excerpt.endsWith('…')).toBe(true);

    expect(quoteOf({ id: 'm2', author, text: '', photoUris: ['file:///p.jpg'] })).toEqual({
      messageId: 'm2',
      authorName: 'Léa M.',
      excerpt: 'Photo',
    });
  });
});
