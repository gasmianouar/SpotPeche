import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, touchTarget } from '@/core/theme/tokens';

import { SpotPhotos } from './SpotPhotos';

interface Props {
  value: string;
  maxLength: number;
  photoUris: readonly string[];
  canAddPhotos: boolean;
  error?: string;
  onChangeText: (text: string) => void;
  onTakePhoto: () => void;
  onPickPhotos: () => void;
  onRemovePhoto: (uri: string) => void;
}

/**
 * Zone de commentaire façon Messenger :
 *   [ miniatures des photos jointes ]
 *   [ texte du commentaire          ]
 *   [ 📷  🖼            120 / 500   ]  ← barre d'outils
 * L'icône appareil photo prend une photo et l'ajoute au commentaire ; la galerie en choisit.
 */
export function CommentComposer({
  value,
  maxLength,
  photoUris,
  canAddPhotos,
  error,
  onChangeText,
  onTakePhoto,
  onPickPhotos,
  onRemovePhoto,
}: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label} nativeID="spot-comment-label">
        Commentaire
      </Text>
      <View style={[styles.box, error && styles.boxError]}>
        <SpotPhotos uris={photoUris} onRemove={onRemovePhoto} />
        <TextInput
          accessibilityLabelledBy="spot-comment-label"
          value={value}
          onChangeText={onChangeText}
          placeholder="Accès, profondeur, techniques qui marchent…"
          placeholderTextColor="#6A7D80"
          multiline
          maxLength={maxLength}
          style={styles.input}
        />
        <View style={styles.toolbar}>
          <ToolButton icon="camera" label="Prendre une photo" disabled={!canAddPhotos} onPress={onTakePhoto} />
          <ToolButton icon="image" label="Choisir dans la galerie" disabled={!canAddPhotos} onPress={onPickPhotos} />
          <Text style={styles.counter}>
            {value.length} / {maxLength}
          </Text>
        </View>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

function ToolButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.tool, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  box: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#C9D5D4',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  boxError: { borderColor: '#B42318' },
  input: {
    minHeight: 80,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tool: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  counter: { marginLeft: 'auto', paddingRight: 10, fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B42318' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
});
