import { InMemoryMessageRepository } from '@/features/spots/data/InMemoryMessageRepository';
import { InMemorySpotRepository } from '@/features/spots/data/InMemorySpotRepository';
import { aMessage, aSpot } from '@/features/spots/testing/spotTestData';

import { GetMyCatches } from '../usecases/GetMyCatches';

const ME = { id: 'me', name: 'Moi', photoUrl: null };

describe('GetMyCatches', () => {
  it('réunit les photos de mes spots et de mes messages, les plus récentes d’abord', async () => {
    const spots = new InMemorySpotRepository([
      aSpot({ id: 'mine', name: 'Ponton nord', ownerId: 'me', photoUris: ['file:///a.jpg'], createdAt: 100 }),
      aSpot({ id: 'other', name: 'Digue du Large', ownerId: 'u2', photoUris: ['file:///pas-a-moi.jpg'], createdAt: 50 }),
    ]);
    const messages = new InMemoryMessageRepository([
      aMessage({ id: 'm1', spotId: 'other', author: ME, photoUris: ['file:///b.jpg', 'file:///c.jpg'], createdAt: 300 }),
      aMessage({ id: 'm2', spotId: 'other', author: ME, photoUris: [], createdAt: 400 }),
      aMessage({ id: 'm3', spotId: 'mine', photoUris: ['file:///quelqu-un.jpg'], createdAt: 500 }),
    ]);

    const catches = await new GetMyCatches(spots, messages).execute('me');

    expect(catches.map((c) => [c.photoUri, c.placeName, c.takenAt])).toEqual([
      ['file:///b.jpg', 'Digue du Large', 300],
      ['file:///c.jpg', 'Digue du Large', 300],
      ['file:///a.jpg', 'Ponton nord', 100],
    ]);
    expect(new Set(catches.map((c) => c.id)).size).toBe(3);
  });

  it('ignore les photos d’un message dont le spot n’existe plus', async () => {
    const messages = new InMemoryMessageRepository([
      aMessage({ id: 'm1', spotId: 'disparu', author: ME, photoUris: ['file:///x.jpg'] }),
    ]);
    expect(await new GetMyCatches(new InMemorySpotRepository([]), messages).execute('me')).toEqual([]);
  });
});
