import { InMemoryReactionRepository } from '../../../data/InMemoryMessageRepository';
import { ReactToMessage } from '../ReactToMessage';

describe('ReactToMessage', () => {
  it('pose une réaction, la remplace par une autre, puis la retire avec le même emoji', async () => {
    const repository = new InMemoryReactionRepository([{ messageId: 'm1', userId: 'u17', emoji: '❤️' }]);
    const useCase = new ReactToMessage(repository);

    expect(await useCase.execute('m1', 'me', '👍')).toBe('👍');
    expect(await useCase.execute('m1', 'me', '🎣')).toBe('🎣');
    expect(await repository.listForMessages(['m1'])).toEqual([
      { messageId: 'm1', userId: 'u17', emoji: '❤️' },
      { messageId: 'm1', userId: 'me', emoji: '🎣' },
    ]);

    expect(await useCase.execute('m1', 'me', '🎣')).toBeNull();
    expect(await repository.listForMessages(['m1'])).toEqual([{ messageId: 'm1', userId: 'u17', emoji: '❤️' }]);
  });

  it('refuse un emoji qui ne fait pas partie des réactions', async () => {
    await expect(new ReactToMessage(new InMemoryReactionRepository()).execute('m1', 'me', '💩')).rejects.toThrow();
  });
});
