import type { Spot } from '../domain/entities/Spot';
import type { SpotRepository } from '../domain/repositories/SpotRepository';

type SampleDetails = Pick<Spot, 'speciesIds' | 'baitIds' | 'activity' | 'description'> & { day: number };

const sample = (
  id: string,
  name: string,
  owner: [id: string, name: string],
  latitude: number,
  longitude: number,
  details: SampleDetails,
): Spot => ({
  id,
  name,
  ownerId: owner[0],
  ownerName: owner[1],
  ownerPhotoUrl: null,
  coordinates: { latitude, longitude },
  speciesIds: details.speciesIds,
  baitIds: details.baitIds,
  activity: details.activity,
  description: details.description,
  photoUris: [],
  createdAt: Date.UTC(2026, 10, details.day, 7, 40),
});

const KARIM: [string, string] = ['u42', 'Karim B.'];
const LEA: [string, string] = ['u17', 'Léa M.'];
const THOMAS: [string, string] = ['u08', 'Thomas R.'];
const INES: [string, string] = ['u23', 'Inès D.'];
const ME: [string, string] = ['me', 'Pêcheur démo'];

/**
 * Spots d'exemple autour du lac de Créteil (Val-de-Marne), le temps d'avoir
 * un vrai backend. Les spots dont ownerId vaut 'me' sont ceux de
 * l'utilisateur de démo (FakeAuthRepository) : ils apparaîtront en vert.
 * Ils servent aussi à remplir la base locale au premier lancement.
 */
export const SAMPLE_SPOTS: Spot[] = [
  sample('s1', 'Ponton nord', KARIM, 48.7812, 2.4455, {
    day: 18,
    speciesIds: ['brochet', 'perche'],
    baitIds: ['shad', 'spoon'],
    activity: 'good',
    description:
      'Ponton en bois accessible à pied. Bonne profondeur en bout de ponton, herbiers sur la gauche. Idéal au leurre souple tôt le matin.',
  }),
  sample('s2', 'Rive est', LEA, 48.7786, 2.4521, {
    day: 15,
    speciesIds: ['sandre'],
    baitIds: ['crank'],
    activity: 'medium',
    description: 'Rive en pente douce, fond de graviers. Les sandres chassent au coucher du soleil.',
  }),
  sample('s3', 'Pont de pierre', KARIM, 48.7745, 2.4402, {
    day: 12,
    speciesIds: ['perche', 'gardon'],
    baitIds: ['worm', 'maggot'],
    activity: 'good',
    description: 'Sous les arches du pont, perches en banc. Ver ou asticot au flotteur.',
  }),
  sample('s4', 'Étang sud', THOMAS, 48.7718, 2.4489, {
    day: 10,
    speciesIds: ['carpe'],
    baitIds: ['corn', 'boilie'],
    activity: 'medium',
    description: 'Coin calme, idéal pour la carpe. Amorcer la veille.',
  }),
  sample('s5', 'Méandre', INES, 48.7841, 2.4378, {
    day: 8,
    speciesIds: ['brochet'],
    baitIds: ['spoon'],
    activity: 'none',
    description: 'Courant fort après la pluie : mieux vaut attendre deux jours.',
  }),
  sample('s6', 'Ponton des Saules', ME, 48.777, 2.4466, {
    day: 20,
    speciesIds: ['brochet', 'perche'],
    baitIds: ['worm', 'shad'],
    activity: 'good',
    description: 'Bonne profondeur en bout de ponton. Herbiers sur la gauche.',
  }),
  sample('s7', 'Bras mort', ME, 48.7731, 2.454, {
    day: 19,
    speciesIds: ['carpe', 'silure'],
    baitIds: ['boilie'],
    activity: 'medium',
    description: '',
  }),
  sample('s8', 'Plage aux carpes', ME, 48.7803, 2.4352, {
    day: 17,
    speciesIds: ['carpe'],
    baitIds: ['corn'],
    activity: 'good',
    description: '',
  }),
];

/** Implémentation en mémoire de SpotRepository (tests). */
export class InMemorySpotRepository implements SpotRepository {
  constructor(private spots: Spot[] = [...SAMPLE_SPOTS]) {}

  async getAll(): Promise<Spot[]> {
    return [...this.spots];
  }

  async getById(id: string): Promise<Spot | null> {
    return this.spots.find((spot) => spot.id === id) ?? null;
  }

  async getByOwner(ownerId: string): Promise<Spot[]> {
    return this.spots.filter((spot) => spot.ownerId === ownerId);
  }

  async save(spot: Spot): Promise<void> {
    this.spots = [spot, ...this.spots.filter((s) => s.id !== spot.id)];
  }
}
