import { InMemorySpotRepository } from '../../../data/InMemorySpotRepository';
import { AddSpotItems } from '../AddSpotItems';
import { SpotNotFoundError } from '../GetSpotDetail';
import { aSpot } from '../../../testing/spotTestData';

describe('AddSpotItems', () => {
  it('ajoute des espèces sans retirer celles qui existaient', async () => {
    const repository = new InMemorySpotRepository([aSpot({ speciesIds: ['brochet', 'perche'] })]);

    const spot = await new AddSpotItems(repository).execute('s1', 'species', ['sandre', 'brochet']);

    expect(spot.speciesIds).toEqual(['brochet', 'perche', 'sandre']);
    expect((await repository.getById('s1'))?.speciesIds).toEqual(['brochet', 'perche', 'sandre']);
  });

  it('ajoute des appâts et ignore ce qui n’est pas au catalogue', async () => {
    const repository = new InMemorySpotRepository([aSpot({ baitIds: ['shad'] })]);

    const spot = await new AddSpotItems(repository).execute('s1', 'bait', ['crank', 'dynamite', 'crank']);

    expect(spot.baitIds).toEqual(['shad', 'crank']);
    expect(spot.speciesIds).toEqual(['brochet']);
  });

  it('ne réenregistre rien quand il n’y a aucune nouveauté', async () => {
    const repository = new InMemorySpotRepository([aSpot()]);
    const save = jest.spyOn(repository, 'save');

    await new AddSpotItems(repository).execute('s1', 'species', ['brochet']);

    expect(save).not.toHaveBeenCalled();
  });

  it('signale un spot introuvable', async () => {
    await expect(new AddSpotItems(new InMemorySpotRepository([])).execute('s1', 'bait', ['shad'])).rejects.toBeInstanceOf(
      SpotNotFoundError,
    );
  });
});
