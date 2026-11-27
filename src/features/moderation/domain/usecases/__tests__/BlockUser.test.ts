import { InMemoryBlockRepository } from '../../../data/InMemoryBlockRepository';
import { BlockNotAllowedError, BlockUser, GetBlockedUsers, UnblockUser } from '../BlockUser';

describe('BlockUser / UnblockUser / GetBlockedUsers', () => {
  it('bloque un pêcheur, le liste, puis le débloque', async () => {
    const repository = new InMemoryBlockRepository();
    const block = new BlockUser(repository, () => new Date(5000));

    await block.execute('me', { id: 'u42', name: 'Karim B.' });

    expect(await new GetBlockedUsers(repository).execute('me')).toEqual([
      { blockerId: 'me', blockedId: 'u42', blockedName: 'Karim B.', createdAt: 5000 },
    ]);

    await new UnblockUser(repository).execute('me', 'u42');
    expect(await repository.listBlockedIds('me')).toEqual([]);
  });

  it('bloquer deux fois la même personne ne crée pas de doublon', async () => {
    const repository = new InMemoryBlockRepository();
    const block = new BlockUser(repository);

    await block.execute('me', { id: 'u42', name: 'Karim B.' });
    await block.execute('me', { id: 'u42', name: 'Karim B.' });

    expect(await repository.listBlockedIds('me')).toEqual(['u42']);
  });

  it('refuse de se bloquer soi-même ou de bloquer sans être connecté', async () => {
    const block = new BlockUser(new InMemoryBlockRepository());

    await expect(block.execute('me', { id: 'me', name: 'Moi' })).rejects.toBeInstanceOf(BlockNotAllowedError);
    await expect(block.execute('', { id: 'u42', name: 'Karim B.' })).rejects.toBeInstanceOf(BlockNotAllowedError);
  });

  it('ne renvoie aucun bloqué sans utilisateur connecté', async () => {
    expect(await new GetBlockedUsers(new InMemoryBlockRepository()).execute('')).toEqual([]);
  });
});
