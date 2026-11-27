import type { Spot } from '../../../domain/entities/Spot';
import { rowToSpot, spotToParams, type SpotRow } from '../SqliteSpotRepository';

jest.mock('expo-sqlite', () => ({}));

const row: SpotRow = {
  id: 's6',
  name: 'Ponton des Saules',
  latitude: 48.777,
  longitude: 2.4466,
  owner_id: 'me',
  owner_name: 'Pêcheur démo',
  owner_photo: null,
  species: '["brochet","perche"]',
  baits: '["shad"]',
  activity: 'good',
  description: 'Accès par le chemin',
  photos: '["file:///photo1.jpg"]',
  created_at: 1795000000000,
  visibility: 'public',
};

const spot: Spot = {
  id: 's6',
  name: 'Ponton des Saules',
  ownerId: 'me',
  ownerName: 'Pêcheur démo',
  ownerPhotoUrl: null,
  coordinates: { latitude: 48.777, longitude: 2.4466 },
  speciesIds: ['brochet', 'perche'],
  baitIds: ['shad'],
  activity: 'good',
  visibility: 'public',
  description: 'Accès par le chemin',
  photoUris: ['file:///photo1.jpg'],
  createdAt: 1795000000000,
};

describe('rowToSpot', () => {
  it('convertit une ligne SQL en entité Spot (listes JSON comprises)', () => {
    expect(rowToSpot(row)).toEqual(spot);
  });

  it('résiste aux valeurs vides ou abîmées', () => {
    const result = rowToSpot({ ...row, species: null, baits: 'pas du json', activity: 'inconnu', description: null, owner_name: null });
    expect(result.speciesIds).toEqual([]);
    expect(result.baitIds).toEqual([]);
    expect(result.activity).toBeNull();
    expect(result.description).toBe('');
    expect(result.ownerName).toBe('');
  });

  it('rend privé un spot dont la visibilité est absente ou inconnue', () => {
    expect(rowToSpot({ ...row, visibility: null }).visibility).toBe('private');
    expect(rowToSpot({ ...row, visibility: 'amis' }).visibility).toBe('private');
  });
});

describe('spotToParams', () => {
  it('produit les valeurs dans l’ordre des colonnes, et l’aller-retour est fidèle', () => {
    const params = spotToParams(spot);
    expect(params).toEqual([
      's6',
      'Ponton des Saules',
      48.777,
      2.4466,
      'me',
      'Pêcheur démo',
      null,
      '["brochet","perche"]',
      '["shad"]',
      'good',
      'Accès par le chemin',
      '["file:///photo1.jpg"]',
      1795000000000,
      'public',
    ]);
  });
});
