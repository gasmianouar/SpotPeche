import type { BlockRepository } from '@/features/moderation/domain/repositories/BlockRepository';

import { findCatalogItems, type CatalogItem } from '../entities/Catalog';
import { FISH_ACTIVITIES, isVisibleTo, type FishActivity, type Spot } from '../entities/Spot';
import {
  creatorPostId,
  REACTION_EMOJIS,
  type Reaction,
  type ReactionEmoji,
  type SpotMessage,
} from '../entities/SpotMessage';
import type { ActivityVoteRepository } from '../repositories/ActivityVoteRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ReactionRepository } from '../repositories/ReactionRepository';
import type { SpotRepository } from '../repositories/SpotRepository';

/** Le spot demandé n'existe pas (supprimé, lien invalide…). */
export class SpotNotFoundError extends Error {
  constructor(readonly spotId: string) {
    super(`Spot introuvable : ${spotId}`);
    this.name = 'SpotNotFoundError';
  }
}

export interface ReactionCount {
  readonly emoji: ReactionEmoji;
  readonly count: number;
}

/** Un message prêt à afficher : réactions comptées, « est-ce le mien ? ». */
export interface MessageView {
  readonly message: SpotMessage;
  readonly isMine: boolean;
  /** Publication du créateur (description + photos de la création). */
  readonly isCreatorPost: boolean;
  /** Réactions présentes, dans l'ordre de REACTION_EMOJIS. */
  readonly reactions: readonly ReactionCount[];
  /** Ma réaction sur ce message, s'il y en a une. */
  readonly myReaction: ReactionEmoji | null;
}

export interface ActivityCount {
  readonly activity: FishActivity;
  readonly count: number;
}

export interface SpotDetail {
  readonly spot: Spot;
  readonly isMine: boolean;
  readonly species: readonly CatalogItem[];
  readonly baits: readonly CatalogItem[];
  readonly messages: readonly MessageView[];
  /** Avis « ça mord ? » : les 3 niveaux, toujours dans le même ordre (0 si personne). */
  readonly activityVotes: readonly ActivityCount[];
  /** Mon avis, s'il y en a un. */
  readonly myVote: FishActivity | null;
}

/**
 * CAS D'USAGE : « afficher la fiche d'un spot ».
 * Rassemble le spot, ses espèces et appâts, les avis « ça mord ? », et la discussion façon Messenger :
 * la publication du créateur en premier, puis les messages, avec leurs réactions.
 */
export class GetSpotDetail {
  constructor(
    private readonly spotRepository: SpotRepository,
    private readonly messageRepository: MessageRepository,
    private readonly reactionRepository: ReactionRepository,
    private readonly voteRepository: ActivityVoteRepository,
    private readonly blockRepository?: Pick<BlockRepository, 'listBlockedIds'>,
  ) {}

  async execute(spotId: string, currentUserId: string): Promise<SpotDetail> {
    const spot = await this.spotRepository.getById(spotId);
    // Un spot privé d'un autre pêcheur se comporte comme un spot inexistant (on ne révèle pas qu'il existe).
    if (!spot || !isVisibleTo(spot, currentUserId)) throw new SpotNotFoundError(spotId);

    const blockedIds = new Set(
      currentUserId && this.blockRepository ? await this.blockRepository.listBlockedIds(currentUserId) : [],
    );
    // Les messages des personnes bloquées sont masqués.
    const stored = (await this.messageRepository.listBySpot(spotId)).filter((m) => !blockedIds.has(m.author.id));
    const post = creatorPost(spot);
    const messages = post ? [post, ...stored] : stored;
    const [reactions, votes] = await Promise.all([
      this.reactionRepository.listForMessages(messages.map((m) => m.id)),
      this.voteRepository.listForSpot(spotId),
    ]);

    return {
      spot,
      isMine: spot.ownerId === currentUserId,
      species: findCatalogItems('species', spot.speciesIds),
      baits: findCatalogItems('bait', spot.baitIds),
      messages: messages.map((message) => ({
        message,
        isMine: message.author.id === currentUserId,
        isCreatorPost: message.id === post?.id,
        ...summarize(reactions.filter((r) => r.messageId === message.id), currentUserId),
      })),
      activityVotes: FISH_ACTIVITIES.map((activity) => ({
        activity,
        count: votes.filter((v) => v.activity === activity).length,
      })),
      myVote: votes.find((v) => v.userId === currentUserId)?.activity ?? null,
    };
  }
}

/** La description et les photos saisies à la création deviennent le premier message. */
export function creatorPost(spot: Spot): SpotMessage | null {
  if (!spot.description.trim() && spot.photoUris.length === 0) return null;
  return {
    id: creatorPostId(spot.id),
    spotId: spot.id,
    author: { id: spot.ownerId, name: spot.ownerName, photoUrl: spot.ownerPhotoUrl },
    text: spot.description,
    photoUris: spot.photoUris,
    replyTo: null,
    createdAt: spot.createdAt,
  };
}

function summarize(reactions: readonly Reaction[], currentUserId: string) {
  return {
    reactions: REACTION_EMOJIS.map((emoji) => ({
      emoji,
      count: reactions.filter((r) => r.emoji === emoji).length,
    })).filter((r) => r.count > 0),
    myReaction: reactions.find((r) => r.userId === currentUserId)?.emoji ?? null,
  };
}
