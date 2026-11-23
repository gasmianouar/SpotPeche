import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, spacing, touchTarget } from '@/core/theme/tokens';

import type { MessageQuote } from '../../../domain/entities/SpotMessage';
import { MESSAGE_MAX_LENGTH } from '../../../domain/usecases/PostMessage';
import { SpotPhotos } from '../../create/components/SpotPhotos';

interface Props {
  text: string;
  photoUris: readonly string[];
  replyTo: MessageQuote | null;
  isSending: boolean;
  canSend: boolean;
  canAddPhotos: boolean;
  error: string | null;
  onChangeText: (text: string) => void;
  onTakePhoto: () => void;
  onPickPhotos: () => void;
  onRemovePhoto: (uri: string) => void;
  onCancelReply: () => void;
  onSend: () => void;
}

/** Barre de saisie fixée en bas, comme sur Messenger : 📷 🖼 [ Aa ] ➤ */
export function MessageComposer(props: Props) {
  return (
    <View style={styles.container}>
      {props.replyTo && (
        <View style={styles.reply}>
          <View style={styles.replyTexts}>
            <Text style={styles.replyTitle}>Réponse à {props.replyTo.authorName}</Text>
            <Text style={styles.replyExcerpt} numberOfLines={1}>
              {props.replyTo.excerpt}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Annuler la réponse"
            onPress={props.onCancelReply}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
      )}
      <SpotPhotos uris={props.photoUris} onRemove={props.onRemovePhoto} />
      {props.error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {props.error}
        </Text>
      )}
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Prendre une photo"
          disabled={!props.canAddPhotos}
          onPress={props.onTakePhoto}
          style={[styles.iconButton, !props.canAddPhotos && styles.disabled]}
        >
          <Ionicons name="camera" size={24} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choisir dans la galerie"
          disabled={!props.canAddPhotos}
          onPress={props.onPickPhotos}
          style={[styles.iconButton, !props.canAddPhotos && styles.disabled]}
        >
          <Ionicons name="image" size={24} color={colors.primary} />
        </Pressable>
        <TextInput
          accessibilityLabel="Écrire un message"
          value={props.text}
          onChangeText={props.onChangeText}
          placeholder="Aa"
          placeholderTextColor="#6A7D80"
          multiline
          maxLength={MESSAGE_MAX_LENGTH}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          accessibilityState={{ disabled: !props.canSend, busy: props.isSending }}
          disabled={!props.canSend}
          onPress={props.onSend}
          style={[styles.iconButton, !props.canSend && styles.disabled]}
        >
          {props.isSending ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="send" size={22} color={colors.primary} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingBottom: spacing.sm,
  },
  reply: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg, paddingTop: spacing.sm },
  replyTexts: { flex: 1, gap: 2 },
  replyTitle: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  replyExcerpt: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B42318', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    marginBottom: 2,
    borderRadius: 20,
    backgroundColor: colors.ground,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
});
