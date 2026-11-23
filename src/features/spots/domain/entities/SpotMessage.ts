/** Auteur d'un message (repris de son profil Facebook). */
export interface SpotAuthor {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string | null;
}

/** Citation du message auquel on répond (comme « Réponse à … » sur Messenger). */
export interface MessageQuote {
  readonly messageId: string;
  readonly authorName: string;
  readonly excerpt: string;
}

/** Un message de la discussion d'un spot. */
export interface SpotMessage {
  readonly id: string;
  readonly spotId: string;
  readonly author: SpotAuthor;
  readonly text: string;
  readonly photoUris: readonly string[];
  readonly replyTo: MessageQuote | null;
  /** Date d'envoi, en millisecondes depuis 1970. */
  readonly createdAt: number;
}

/** Les réactions possibles sous un message, dans l'ordre d'affichage. */
export const REACTION_EMOJIS = ['👍', '❤️', '😆', '😮', '🎣', '🐟'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const isReactionEmoji = (value: string): value is ReactionEmoji =>
  (REACTION_EMOJIS as readonly string[]).includes(value);

/** Une réaction : une seule par personne et par message (comme sur Messenger). */
export interface Reaction {
  readonly messageId: string;
  readonly userId: string;
  readonly emoji: ReactionEmoji;
}

/**
 * Le premier message de la discussion est la publication du créateur :
 * la description et les photos saisies à la création du spot.
 * On ne le recopie pas en base : il a un identifiant fixe, dérivé du spot,
 * pour qu'on puisse y réagir et y répondre comme aux autres.
 */
export const creatorPostId = (spotId: string) => `${spotId}#post`;

const EXCERPT_MAX_LENGTH = 80;

/** Fabrique la citation d'un message, pour une réponse. */
export function quoteOf(message: Pick<SpotMessage, 'id' | 'author' | 'text' | 'photoUris'>): MessageQuote {
  const text = message.text.trim().replace(/\s+/g, ' ');
  const excerpt = text
    ? text.length > EXCERPT_MAX_LENGTH
      ? `${text.slice(0, EXCERPT_MAX_LENGTH - 1)}…`
      : text
    : message.photoUris.length > 0
      ? 'Photo'
      : '';
  return { messageId: message.id, authorName: message.author.name, excerpt };
}
