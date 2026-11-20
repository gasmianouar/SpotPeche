import { InMemorySpotRepository } from '../../../data/InMemorySpotRepository';
import type { Spot } from '../../entities/Spot';
import { GetMapSpots } from '../GetMapSpots';

const spot = (id: string, ownerId: string): Spot => ({
  id,
  name: `Spot ${id}`,
  ownerId,
  coordinates: { latitude: 48.7, longitude: 2.4 },
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
});
