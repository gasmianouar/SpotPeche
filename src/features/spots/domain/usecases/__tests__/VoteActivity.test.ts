import { InMemoryActivityVoteRepository } from '../../../data/InMemoryActivityVoteRepository';
import { VoteActivity } from '../VoteActivity';

describe('VoteActivity', () => {
  it('donne un avis, le change, puis le retire en retouchant le même', async () => {
    const repository = new InMemoryActivityVoteRepository([{ spotId: 's1', userId: 'u17', activity: 'good' }]);
    const useCase = new VoteActivity(repository);

    expect(await useCase.execute('s1', 'me', 'medium')).toBe('medium');
    expect(await useCase.execute('s1', 'me', 'good')).toBe('good');
    expect(await repository.listForSpot('s1')).toEqual([
      { spotId: 's1', userId: 'u17', activity: 'good' },
      { spotId: 's1', userId: 'me', activity: 'good' },
    ]);

    expect(await useCase.execute('s1', 'me', 'good')).toBeNull();
    expect(await repository.listForSpot('s1')).toHaveLength(1);
  });

  it('refuse une activité inconnue', async () => {
    await expect(new VoteActivity(new InMemoryActivityVoteRepository()).execute('s1', 'me', 'excellent')).rejects.toThrow();
  });
});
