import { InMemorySpotRepository } from '../../../data/InMemorySpotRepository';
import type { Spot } from '../../entities/Spot';
import { GetMapSpots } from '../GetMapSpots';

const spot = (id: string, ownerId: string): Spot => ({
  id,
  name: `Spot ${id}`,
  ownerId,
  coordinates: { latitude: 48.7, longitude: 2.4 },
  ownerName: '',
  ownerPhotoUrl: null,
  speciesIds: [],
  baitIds: [],
  activity: null,
  description: '',
  photoUris: [],
  createdAt: 0,
});

describe('GetMapSpots', () => {
  it('marque en « mien » uniquement les spots de l’utilisateur connecté', async () => {
    const useCase = new GetMapSpots(new InMemorySpotRepository([spot('a', 'me'), spot('b', 'other')]));

    const result = await useCase.execute('me');

    expect(result).toEqual([
      { spot: spot('a', 'me'), isMine: true },
      { spot: spot('b', 'other'), isMine: false },
    ]);
  });

  it('ne marque aucun spot comme « mien » si personne n’est connecté', async () => {
    const useCase = new GetMapSpots(new InMemorySpotRepository([spot('a', 'me')]));

    const result = await useCase.execute('');

    expect(result.every((s) => !s.isMine)).toBe(true);
  });

  it('avec le filtre « mine », ne renvoie que mes spots', async () => {
    const useCase = new GetMapSpots(new InMemorySpotRepository([spot('a', 'me'), spot('b', 'other'), spot('c', 'me')]));

    const result = await useCase.execute('me', 'mine');

    expect(result.map((s) => s.spot.id)).toEqual(['a', 'c']);
    expect(result.every((s) => s.isMine)).toBe(true);
  });

  it('avec le filtre « mine » et personne de connecté, ne renvoie rien', async () => {
    const useCase = new GetMapSpots(new InMemorySpotRepository([spot('a', 'me')]));

    expect(await useCase.execute('', 'mine')).toEqual([]);
  });
});
