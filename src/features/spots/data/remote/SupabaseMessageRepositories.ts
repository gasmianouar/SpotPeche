import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabasePhotoStorage } from '@/core/supabase/SupabasePhotoStorage';
import { fromIso, throwIfError, toIso } from '@/core/supabase/supabaseClient';

import { isFishActivity, type ActivityVote, type FishActivity } from '../../domain/entities/Spot';
import { isReactionEmoji, type Reaction, type ReactionEmoji, type SpotMessage } from '../../domain/entities/SpotMessage';
import type { ActivityVoteRepository } from '../../domain/repositories/ActivityVoteRepository';
import type { MessageRepository } from '../../domain/repositories/MessageRepository';
import type { ReactionRepository } from '../../domain/repositories/ReactionRepository';

/** Une ligne de la table `spot_messages` dans Supabase. */
export interface MessageRecord {
  id: string;
  spot_id: string;
  author_id: string | null;
  author_name: string;
  author_photo: string | null;
  text: string;
  photos: string[];
  reply_to_id: string | null;
  reply_author: string | null;
  reply_excerpt: string | null;
  created_at: string;
}

const MESSAGE_COLUMNS =
  'id, spot_id, author_id, author_name, author_photo, text, photos, reply_to_id, reply_author, reply_excerpt, created_at';

export function recordToMessage(record: MessageRecord, photoUrls: Map<string, string>): SpotMessage {
  return {
    id: record.id,
    spotId: record.spot_id,
    author: { id: record.author_id ?? '', name: record.author_name, photoUrl: record.author_photo },
    text: record.text,
    photoUris: (record.photos ?? []).map((path) => photoUrls.get(path)).filter((url): url is string => Boolean(url)),
    replyTo: record.reply_to_id
      ? { messageId: record.reply_to_id, authorName: record.reply_author ?? '', excerpt: record.reply_excerpt ?? '' }
      : null,
    createdAt: fromIso(record.created_at),
  };
}

/** Messages des spots sur le serveur (seulement ceux des spots visibles, hors personnes bloquées). */
export class SupabaseMessageRepository implements MessageRepository {
  private readonly photos: SupabasePhotoStorage;

  constructor(private readonly supabase: SupabaseClient) {
    this.photos = new SupabasePhotoStorage(supabase);
  }

  listBySpot(spotId: string): Promise<SpotMessage[]> {
    return this.load(
      this.supabase.from('spot_messages').select(MESSAGE_COLUMNS).eq('spot_id', spotId).order('created_at', { ascending: true }),
    );
  }

  listByAuthor(authorId: string): Promise<SpotMessage[]> {
    if (!authorId) return Promise.resolve([]);
    return this.load(
      this.supabase
        .from('spot_messages')
        .select(MESSAGE_COLUMNS)
        .eq('author_id', authorId)
        .order('created_at', { ascending: false }),
    );
  }

  async add(message: SpotMessage): Promise<void> {
    const photos = await this.photos.toStoragePaths(message.photoUris);
    // Auteur, nom et citation sont remplis par le serveur à partir du compte connecté.
    throwIfError(
      await this.supabase.from('spot_messages').insert({
        id: message.id,
        spot_id: message.spotId,
        text: message.text,
        photos,
        reply_to_id: message.replyTo?.messageId ?? null,
        created_at: toIso(message.createdAt),
      }),
    );
  }

  private async load(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<SpotMessage[]> {
    const records = (throwIfError(await query) ?? []) as MessageRecord[];
    const urls = await this.photos.toDisplayUrls(records.flatMap((r) => r.photos ?? []));
    return records.map((record) => recordToMessage(record, urls));
  }
}

/** Réactions emoji sur le serveur : une par personne et par message. */
export class SupabaseReactionRepository implements ReactionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForMessages(messageIds: readonly string[]): Promise<Reaction[]> {
    if (messageIds.length === 0) return [];
    const rows = throwIfError(
      await this.supabase.from('message_reactions').select('message_id, user_id, emoji').in('message_id', [...messageIds]),
    ) as { message_id: string; user_id: string; emoji: string }[];
    return (rows ?? [])
      .filter((row) => isReactionEmoji(row.emoji))
      .map((row) => ({ messageId: row.message_id, userId: row.user_id, emoji: row.emoji as ReactionEmoji }));
  }

  async set(messageId: string, userId: string, emoji: ReactionEmoji | null): Promise<void> {
    if (emoji === null) {
      throwIfError(await this.supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: userId }));
    } else {
      throwIfError(
        await this.supabase.from('message_reactions').upsert({ message_id: messageId, user_id: userId, emoji }),
      );
    }
  }
}

/** Avis « ça mord ? » sur le serveur : un par personne et par spot. */
export class SupabaseActivityVoteRepository implements ActivityVoteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForSpot(spotId: string): Promise<ActivityVote[]> {
    const rows = throwIfError(
      await this.supabase.from('spot_activity_votes').select('spot_id, user_id, activity').eq('spot_id', spotId),
    ) as { spot_id: string; user_id: string; activity: string }[];
    return (rows ?? []).flatMap((row) =>
      isFishActivity(row.activity) ? [{ spotId: row.spot_id, userId: row.user_id, activity: row.activity }] : [],
    );
  }

  async set(spotId: string, userId: string, activity: FishActivity | null): Promise<void> {
    if (activity === null) {
      throwIfError(await this.supabase.from('spot_activity_votes').delete().match({ spot_id: spotId, user_id: userId }));
    } else {
      throwIfError(
        await this.supabase
          .from('spot_activity_votes')
          .upsert({ spot_id: spotId, user_id: userId, activity, updated_at: new Date().toISOString() }),
      );
    }
  }
}
