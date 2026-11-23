import type { IdGenerator } from '@/core/ids/IdGenerator';

import type { MessageQuote, SpotAuthor, SpotMessage } from '../entities/SpotMessage';
import type { MessageRepository } from '../repositories/MessageRepository';

export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGE_MAX_PHOTOS = 6;

/** Erreur métier : message vide ou trop long. */
export class MessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageValidationError';
  }
}

export interface NewMessage {
  spotId: string;
  author: SpotAuthor;
  text: string;
  photoUris: readonly string[];
  replyTo: MessageQuote | null;
}

/**
 * CAS D'USAGE : « écrire dans la discussion d'un spot ».
 * Un message contient du texte, des photos, ou les deux ; il peut répondre à un autre.
 */
export class PostMessage {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly idGenerator: IdGenerator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: NewMessage): Promise<SpotMessage> {
    const text = input.text.trim();
    if (!text && input.photoUris.length === 0) {
      throw new MessageValidationError('Écrivez un message ou ajoutez une photo.');
    }
    if (text.length > MESSAGE_MAX_LENGTH) {
      throw new MessageValidationError(`Le message ne doit pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`);
    }
    if (input.photoUris.length > MESSAGE_MAX_PHOTOS) {
      throw new MessageValidationError(`${MESSAGE_MAX_PHOTOS} photos au maximum par message.`);
    }

    const message: SpotMessage = {
      id: this.idGenerator.next(),
      spotId: input.spotId,
      author: input.author,
      text,
      photoUris: [...input.photoUris],
      replyTo: input.replyTo,
      createdAt: this.now().getTime(),
    };
    await this.messageRepository.add(message);
    return message;
  }
}
