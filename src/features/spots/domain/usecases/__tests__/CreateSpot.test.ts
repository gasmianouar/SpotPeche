import { InMemoryActivityVoteRepository } from '../../../data/InMemoryActivityVoteRepository';
import { InMemorySpotRepository } from '../../../data/InMemorySpotRepository';
import { buildSpotName, CreateSpot, DESCRIPTION_MAX_LENGTH, SpotValidationError, type SpotDraft } from '../CreateSpot';

const NOW = new Date(2026, 10, 23, 9, 30); // 23 novembre 2026
const ME = { id: 'me', name: 'Anouar G.', photoUrl: 'https://exemple.test/photo.jpg' };

const draft = (overrides: Partial<SpotDraft> = {}): SpotDraft => ({
  coordinates: { latitude: 48.771234, longitude: 2.448765 },
  speciesIds: [],
  baitIds: [],
  activity: null,
  visibility: 'private',
  description: '',
  photoUris: [],
  ...overrides,
});

function setup() {
  const repository = new InMemorySpotRepository([]);
  const votes = new InMemoryActivityVoteRepository();
  const useCase = new CreateSpot(repository, votes, { next: () => 'new-id' }, () => NOW);
  return { repository, votes, useCase };
}

describe('CreateSpot', () => {
  it('enregistre le spot avec les coordonnées exactes et le propriétaire', async () => {
    const { repository, useCase } = setup();

    const spot = await useCase.execute(
      draft({ speciesIds: ['brochet'], baitIds: ['shad'], activity: 'good', description: '  Bord du lac  ' }), ME);

    expect(spot).toEqual({
      id: 'new-id',
      name: 'Spot à brochet du 23/11',
      ownerId: 'me',
      ownerName: 'Anouar G.',
      ownerPhotoUrl: 'https://exemple.test/photo.jpg',
      coordinates: { latitude: 48.771234, longitude: 2.448765 },
      speciesIds: ['brochet'],
      baitIds: ['shad'],
      activity: 'good',
      visibility: 'private',
      description: 'Bord du lac',
      photoUris: [],
      createdAt: NOW.getTime(),
    });
    expect(await repository.getAll()).toEqual([spot]);
  });

  it('l’activité choisie devient le premier avis « ça mord ? », celui du créateur', async () => {
    const { votes, useCase } = setup();

    await useCase.execute(draft({ activity: 'medium' }), ME);

    expect(await votes.listForSpot('new-id')).toEqual([{ spotId: 'new-id', userId: 'me', activity: 'medium' }]);
  });

  it('enregistre la visibilité choisie', async () => {
    const { useCase } = setup();

    const spot = await useCase.execute(draft({ visibility: 'public' }), ME);

    expect(spot.visibility).toBe('public');
  });

  it('rend le spot privé si la visibilité reçue est inattendue', async () => {
    const { useCase } = setup();

    const spot = await useCase.execute(draft({ visibility: 'tout-le-monde' as never }), ME);

    expect(spot.visibility).toBe('private');
  });

  it('refuse un spot sans position', async () => {
    const { repository, useCase } = setup();

    await expect(useCase.execute(draft({ coordinates: null }), ME)).rejects.toMatchObject({
      field: 'coordinates',
    });
    expect(await repository.getAll()).toEqual([]);
  });

  it('refuse des coordonnées impossibles', async () => {
    const { useCase } = setup();

    await expect(useCase.execute(draft({ coordinates: { latitude: 120, longitude: 2 } }), ME)).rejects.toBeInstanceOf(
      SpotValidationError,
    );
  });

  it('refuse une description trop longue', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute(draft({ description: 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1) }), ME),
    ).rejects.toMatchObject({ field: 'description' });
  });

  it('ignore les identifiants inconnus du catalogue et les doublons', async () => {
    const { useCase } = setup();

    const spot = await useCase.execute(draft({ speciesIds: ['perche', 'licorne', 'perche'], baitIds: ['shad', 'x'] }), ME);

    expect(spot.speciesIds).toEqual(['perche']);
    expect(spot.baitIds).toEqual(['shad']);
  });
});

describe('buildSpotName', () => {
  it('utilise la première espèce choisie', () => {
    expect(buildSpotName(['sandre', 'perche'], NOW)).toBe('Spot à sandre du 23/11');
  });

  it('se contente de la date sans espèce', () => {
    expect(buildSpotName([], NOW)).toBe('Spot du 23/11');
  });
});
