import type { DatabaseProvider } from '@/core/database/openDatabase';

import { isReactionEmoji, type Reaction, type ReactionEmoji, type SpotMessage } from '../../domain/entities/SpotMessage';
import type { MessageRepository } from '../../domain/repositories/MessageRepository';
import type { ReactionRepository } from '../../domain/repositories/ReactionRepository';
import { parseList } from './jsonColumns';

/** Une ligne de la table `spot_messages`. */
export interface MessageRow {
  id: string;
  spot_id: string;
  author_id: string;
  author_name: string;
  author_photo: string | null;
  text: string;
  photos: string | null;
  reply_to_id: string | null;
  reply_author: string | null;
  reply_excerpt: string | null;
  created_at: number;
}

/** Ligne SQL → entité (la citation n'existe que si reply_to_id est rempli). */
export function rowToMessage(row: MessageRow): SpotMessage {
  return {
    id: row.id,
    spotId: row.spot_id,
    author: { id: row.author_id, name: row.author_name, photoUrl: row.author_photo },
    text: row.text,
    photoUris: parseList(row.photos),
    replyTo: row.reply_to_id
      ? { messageId: row.reply_to_id, authorName: row.reply_author ?? '', excerpt: row.reply_excerpt ?? '' }
      : null,
    createdAt: row.created_at,
  };
}

/** Entité → valeurs, dans l'ordre des colonnes de INSERT_MESSAGE. */
export function messageToParams(message: SpotMessage): (string | number | null)[] {
  return [
    message.id,
    message.spotId,
    message.author.id,
    message.author.name,
    message.author.photoUrl,
    message.text,
    JSON.stringify(message.photoUris),
    message.replyTo?.messageId ?? null,
    message.replyTo?.authorName ?? null,
    message.replyTo?.excerpt ?? null,
    message.createdAt,
  ];
}

const INSERT_MESSAGE =
  'INSERT OR REPLACE INTO spot_messages (id, spot_id, author_id, author_name, author_photo, text, photos, reply_to_id, reply_author, reply_excerpt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

/** Messages des spots, stockés dans la base SQLite du téléphone. */
export class SqliteMessageRepository implements MessageRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async listBySpot(spotId: string): Promise<SpotMessage[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<MessageRow>(
      'SELECT * FROM spot_messages WHERE spot_id = ? ORDER BY created_at ASC',
      spotId,
    );
    return rows.map(rowToMessage);
  }

  async listByAuthor(authorId: string): Promise<SpotMessage[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<MessageRow>(
      'SELECT * FROM spot_messages WHERE author_id = ? ORDER BY created_at DESC',
      authorId,
    );
    return rows.map(rowToMessage);
  }

  async add(message: SpotMessage): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(INSERT_MESSAGE, messageToParams(message));
  }
}

interface ReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

/** Réactions emoji, stockées dans SQLite (une ligne par personne et par message). */
export class SqliteReactionRepository implements ReactionRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async listForMessages(messageIds: readonly string[]): Promise<Reaction[]> {
    if (messageIds.length === 0) return [];
    const db = await this.getDatabase();
    // Un « ? » par identifiant : la requête reste paramétrée.
    const placeholders = messageIds.map(() => '?').join(', ');
    const rows = await db.getAllAsync<ReactionRow>(
      `SELECT message_id, user_id, emoji FROM message_reactions WHERE message_id IN (${placeholders})`,
      [...messageIds],
    );
    return rows
      .filter((row) => isReactionEmoji(row.emoji))
      .map((row) => ({ messageId: row.message_id, userId: row.user_id, emoji: row.emoji as ReactionEmoji }));
  }

  async set(messageId: string, userId: string, emoji: ReactionEmoji | null): Promise<void> {
    const db = await this.getDatabase();
    if (emoji === null) {
      await db.runAsync('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?', messageId, userId);
    } else {
      // La clé primaire (message_id, user_id) garantit une seule réaction par personne.
      await db.runAsync(
        'INSERT OR REPLACE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
        messageId,
        userId,
        emoji,
      );
    }
  }
}
