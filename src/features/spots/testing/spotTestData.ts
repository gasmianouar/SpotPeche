import type { Spot } from '../domain/entities/Spot';
import type { SpotMessage } from '../domain/entities/SpotMessage';

/** Fabriques de données pour les tests (valeurs par défaut + ce qui change). */
export const aSpot = (overrides: Partial<Spot> = {}): Spot => ({
  id: 's1',
  name: 'Spot du 23/11',
  ownerId: 'u42',
  ownerName: 'Karim B.',
  ownerPhotoUrl: null,
  coordinates: { latitude: 48.7812, longitude: 2.4455 },
  speciesIds: ['brochet'],
  baitIds: ['shad'],
  activity: 'good',
  visibility: 'public',
  description: 'Ponton en bois.',
  photoUris: [],
  createdAt: 1000,
  ...overrides,
});

export const aMessage = (overrides: Partial<SpotMessage> = {}): SpotMessage => ({
  id: 'm1',
  spotId: 's1',
  author: { id: 'u17', name: 'Léa M.', photoUrl: null },
  text: 'Merci !',
  photoUris: [],
  replyTo: null,
  createdAt: 2000,
  ...overrides,
});
