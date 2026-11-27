import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, spacing, touchTarget } from '@/core/theme/tokens';
import { Avatar } from '@/shared/ui/Avatar';

import { REACTION_EMOJIS, type ReactionEmoji } from '../../../domain/entities/SpotMessage';
import type { MessageView } from '../../../domain/usecases/GetSpotDetail';
import { formatMessageTime } from '../format';

interface Props {
  view: MessageView;
  reactionsOpen: boolean;
  onToggleReactions: (messageId: string) => void;
  onReact: (messageId: string, emoji: ReactionEmoji) => void;
  onReply: (view: MessageView) => void;
}

/**
 * Une bulle de discussion façon Messenger :
 * - les autres à gauche avec leur avatar, mes messages à droite en vert ;
 * - la citation du message auquel on répond, puis photos et texte ;
 * - les réactions en pastille dans le coin, puis « Réagir » et « Répondre ».
 * `memo` : une bulle n'est redessinée que si ses données changent.
 */
export const MessageBubble = memo(function MessageBubble({ view, reactionsOpen, onToggleReactions, onReact, onReply }: Props) {
  const { message, isMine, isCreatorPost, reactions, myReaction } = view;
  const { t, language } = useI18n();
  const authorName = message.author.name || t('common.fisher');
  const reactionText = reactions.map((r) => (r.count > 1 ? `${r.emoji} ${r.count}` : r.emoji)).join(' ');

  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      {!isMine && (
        <View style={styles.avatar}>
          <Avatar name={authorName} photoUrl={message.author.photoUrl} size={32} />
        </View>
      )}
      <View style={[styles.column, isMine && styles.columnMine]}>
        {!isMine && (
          <Text style={styles.author}>
            {authorName}
            {isCreatorPost ? t('message.creator') : ''}
          </Text>
        )}

        {message.photoUris.map((uri, index) => (
          <Image
            key={uri}
            source={{ uri }}
            style={styles.photo}
            accessibilityLabel={t('message.photo', { number: index + 1, author: authorName })}
          />
        ))}

        {(message.text.length > 0 || message.replyTo) && (
          <View style={[styles.bubbleWrap, reactions.length > 0 && styles.bubbleWrapReacted]}>
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              {message.replyTo && (
                <View style={[styles.quote, isMine && styles.quoteMine]}>
                  <Text style={[styles.quoteText, isMine && styles.textOnDark]} numberOfLines={2}>
                    {t('message.replyTo', { author: message.replyTo.authorName, excerpt: message.replyTo.excerpt === 'Photo' ? t('message.photoExcerpt') : message.replyTo.excerpt })}
                  </Text>
                </View>
              )}
              {message.text.length > 0 && <Text style={[styles.text, isMine && styles.textOnDark]}>{message.text}</Text>}
            </View>
            {reactions.length > 0 && (
              <View style={[styles.reactions, isMine ? styles.reactionsMine : styles.reactionsOther]}>
                <Text style={styles.reactionsText} accessibilityLabel={t('message.reactions', { reactions: reactionText })}>
                  {reactionText}
                </Text>
              </View>
            )}
          </View>
        )}
        {message.text.length === 0 && !message.replyTo && reactions.length > 0 && (
          <Text style={styles.reactionsInline}>{reactionText}</Text>
        )}

        <View style={[styles.actions, isMine && styles.actionsMine]}>
          <Text style={styles.time}>{formatMessageTime(message.createdAt, language)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: reactionsOpen }}
            hitSlop={6}
            onPress={() => onToggleReactions(message.id)}
            style={styles.action}
          >
            <Ionicons name="happy-outline" size={16} color={colors.muted} />
            <Text style={styles.actionLabel}>{t('message.react')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={6} onPress={() => onReply(view)} style={styles.action}>
            <Ionicons name="arrow-undo-outline" size={16} color={colors.muted} />
            <Text style={styles.actionLabel}>{t('message.reply')}</Text>
          </Pressable>
        </View>

        {reactionsOpen && (
          <View accessibilityLabel={t('message.chooseReaction')} style={[styles.picker, isMine && styles.pickerMine]}>
            {REACTION_EMOJIS.map((emoji) => {
              const selected = emoji === myReaction;
              return (
                <Pressable
                  key={emoji}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('message.reactWith', { emoji })}
                  onPress={() => onReact(message.id, emoji)}
                  style={[styles.emoji, selected && styles.emojiSelected]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rowMine: { justifyContent: 'flex-end' },
  avatar: { marginTop: 18 },
  // flexShrink : la colonne rétrécit sur les petits écrans au lieu de déborder.
  column: { flexShrink: 1, maxWidth: 300, gap: 4, alignItems: 'flex-start' },
  columnMine: { alignItems: 'flex-end' },
  author: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, paddingLeft: 12 },
  photo: { width: 220, maxWidth: '100%', height: 160, borderRadius: 18, backgroundColor: colors.border },
  bubbleWrap: { position: 'relative', maxWidth: '100%' },
  bubbleWrapReacted: { marginBottom: 10 },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18 },
  bubbleOther: { backgroundColor: colors.surface },
  bubbleMine: { backgroundColor: colors.primary },
  quote: { marginBottom: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.ground },
  quoteMine: { backgroundColor: 'rgba(255,255,255,0.18)' },
  quoteText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  textOnDark: { color: colors.surface },
  reactions: {
    position: 'absolute',
    bottom: -12,
    minHeight: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    shadowColor: '#10282C',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  reactionsOther: { right: 10 },
  reactionsMine: { left: 10 },
  reactionsText: { fontSize: 12, color: colors.ink },
  reactionsInline: { fontSize: 12, color: colors.ink, paddingHorizontal: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12 },
  actionsMine: { justifyContent: 'flex-end' },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  action: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '100%',
    gap: 2,
    padding: 4,
    borderRadius: 26,
    backgroundColor: colors.surface,
    shadowColor: '#10282C',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pickerMine: { alignSelf: 'flex-end' },
  emoji: { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, alignItems: 'center', justifyContent: 'center' },
  emojiSelected: { backgroundColor: colors.primarySoft },
  emojiText: { fontSize: 24 },
});
