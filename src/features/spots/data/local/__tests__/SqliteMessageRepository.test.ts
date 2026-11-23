import { SPOT_MIGRATIONS } from '../spotMigrations';
import { messageToParams, rowToMessage, type MessageRow } from '../SqliteMessageRepository';

jest.mock('expo-sqlite', () => ({}));

const row: MessageRow = {
  id: 'm1',
  spot_id: 's1',
  author_id: 'u17',
  author_name: 'Léa M.',
  author_photo: null,
  text: 'Merci !',
  photos: '["file:///p.jpg"]',
  reply_to_id: 's1#post',
  reply_author: 'Karim B.',
  reply_excerpt: 'Ponton en bois.',
  created_at: 5000,
};

describe('SqliteMessageRepository (conversion)', () => {
  it('convertit une ligne en message, citation comprise, et l’aller-retour est fidèle', () => {
    const message = rowToMessage(row);

    expect(message).toEqual({
      id: 'm1',
      spotId: 's1',
      author: { id: 'u17', name: 'Léa M.', photoUrl: null },
      text: 'Merci !',
      photoUris: ['file:///p.jpg'],
      replyTo: { messageId: 's1#post', authorName: 'Karim B.', excerpt: 'Ponton en bois.' },
      createdAt: 5000,
    });
    expect(messageToParams(message)).toEqual(Object.values(row));
  });

  it('un message sans réponse n’a pas de citation', () => {
    expect(rowToMessage({ ...row, reply_to_id: null }).replyTo).toBeNull();
  });

  it('les migrations 3 (fiche spot) et 4 (avis « ça mord ? ») suivent la 2', () => {
    expect(SPOT_MIGRATIONS.map((m) => m.version)).toEqual([1, 2, 3, 4]);
  });
});
