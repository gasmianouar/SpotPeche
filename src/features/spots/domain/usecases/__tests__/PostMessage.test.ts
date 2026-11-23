import { InMemoryMessageRepository } from '../../../data/InMemoryMessageRepository';
import { MESSAGE_MAX_LENGTH, MessageValidationError, PostMessage, type NewMessage } from '../PostMessage';

const AUTHOR = { id: 'me', name: 'Anouar G.', photoUrl: null };
const input = (overrides: Partial<NewMessage> = {}): NewMessage => ({
  spotId: 's1',
  author: AUTHOR,
  text: 'Belle prise ce matin',
  photoUris: [],
  replyTo: null,
  ...overrides,
});

function setup() {
  const repository = new InMemoryMessageRepository();
  const useCase = new PostMessage(repository, { next: () => 'msg-1' }, () => new Date(5000));
  return { repository, useCase };
}

describe('PostMessage', () => {
  it('enregistre le message, texte nettoyé, avec la citation de la réponse', async () => {
    const { repository, useCase } = setup();
    const replyTo = { messageId: 's1#post', authorName: 'Karim B.', excerpt: 'Ponton en bois.' };

    const message = await useCase.execute(input({ text: '  Merci !  ', replyTo }));

    expect(message).toEqual({
      id: 'msg-1',
      spotId: 's1',
      author: AUTHOR,
      text: 'Merci !',
      photoUris: [],
      replyTo,
      createdAt: 5000,
    });
    expect(await repository.listBySpot('s1')).toEqual([message]);
  });

  it('accepte une photo sans texte', async () => {
    const { useCase } = setup();

    const message = await useCase.execute(input({ text: ' ', photoUris: ['file:///prise.jpg'] }));

    expect(message.photoUris).toEqual(['file:///prise.jpg']);
  });

  it('refuse un message vide ou trop long', async () => {
    const { useCase } = setup();

    await expect(useCase.execute(input({ text: '   ' }))).rejects.toBeInstanceOf(MessageValidationError);
    await expect(useCase.execute(input({ text: 'a'.repeat(MESSAGE_MAX_LENGTH + 1) }))).rejects.toBeInstanceOf(
      MessageValidationError,
    );
  });
});
