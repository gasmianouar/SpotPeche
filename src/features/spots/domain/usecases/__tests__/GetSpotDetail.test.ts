import { InMemoryActivityVoteRepository } from '../../../data/InMemoryActivityVoteRepository';
import { InMemoryMessageRepository, InMemoryReactionRepository } from '../../../data/InMemoryMessageRepository';
import { InMemorySpotRepository } from '../../../data/InMemorySpotRepository';
import { creatorPostId } from '../../entities/SpotMessage';
import { GetSpotDetail, SpotNotFoundError } from '../GetSpotDetail';
import { aMessage, aSpot } from '../../../testing/spotTestData';

function setup(spot = aSpot()) {
  const messages = new InMemoryMessageRepository([
    aMessage({ id: 'm2', text: 'Deuxième', createdAt: 3000 }),
    aMessage({ id: 'm1', author: { id: 'me', name: 'Moi', photoUrl: null }, createdAt: 2000 }),
    aMessage({ id: 'autre', spotId: 's9' }),
  ]);
  const reactions = new InMemoryReactionRepository([
    { messageId: creatorPostId('s1'), userId: 'u17', emoji: '❤️' },
    { messageId: creatorPostId('s1'), userId: 'u08', emoji: '❤️' },
    { messageId: creatorPostId('s1'), userId: 'me', emoji: '👍' },
  ]);
  const votes = new InMemoryActivityVoteRepository([
    { spotId: 's1', userId: 'u42', activity: 'good' },
    { spotId: 's1', userId: 'me', activity: 'good' },
    { spotId: 's1', userId: 'u17', activity: 'none' },
    { spotId: 's9', userId: 'u17', activity: 'medium' },
  ]);
  return new GetSpotDetail(new InMemorySpotRepository([spot]), messages, reactions, votes);
}

describe('GetSpotDetail', () => {
  it('place la publication du créateur en premier, puis les messages du spot dans l’ordre', async () => {
    const detail = await setup().execute('s1', 'me');

    expect(detail.messages.map((m) => m.message.id)).toEqual([creatorPostId('s1'), 'm1', 'm2']);
    expect(detail.messages[0]).toMatchObject({
      isCreatorPost: true,
      message: { text: 'Ponton en bois.', author: { id: 'u42', name: 'Karim B.' } },
    });
  });

  it('compte les réactions dans l’ordre des emoji et retrouve la mienne', async () => {
    const detail = await setup().execute('s1', 'me');

    expect(detail.messages[0].reactions).toEqual([
      { emoji: '👍', count: 1 },
      { emoji: '❤️', count: 2 },
    ]);
    expect(detail.messages[0].myReaction).toBe('👍');
    expect(detail.messages[1]).toMatchObject({ isMine: true, reactions: [], myReaction: null });
  });

  it('donne les espèces et appâts du catalogue, et dit si le spot est à moi', async () => {
    const detail = await setup().execute('s1', 'u42');

    expect(detail.isMine).toBe(true);
    expect(detail.species.map((s) => s.name)).toEqual(['Brochet']);
    expect(detail.baits.map((b) => b.name)).toEqual(['Leurre souple']);
  });

  it('compte les avis « ça mord ? » des 3 niveaux et retrouve le mien', async () => {
    const detail = await setup().execute('s1', 'me');

    expect(detail.activityVotes).toEqual([
      { activity: 'good', count: 2 },
      { activity: 'medium', count: 0 },
      { activity: 'none', count: 1 },
    ]);
    expect(detail.myVote).toBe('good');
    expect((await setup().execute('s1', 'personne')).myVote).toBeNull();
  });

  it('n’invente pas de publication quand la création n’avait ni texte ni photo', async () => {
    const detail = await setup(aSpot({ description: '  ' })).execute('s1', 'me');

    expect(detail.messages.map((m) => m.message.id)).toEqual(['m1', 'm2']);
  });

  it('signale un spot introuvable', async () => {
    await expect(setup().execute('inconnu', 'me')).rejects.toBeInstanceOf(SpotNotFoundError);
  });
});
