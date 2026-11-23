import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import type { CatalogKind } from '../../domain/entities/Catalog';
import { useRecognitionViewModel } from './useRecognitionViewModel';

const TITLES: Record<CatalogKind, string> = { species: "Reconnaître l'espèce", bait: "Reconnaître l'appât" };
const percent = (confidence: number) => `${Math.round(confidence * 100)} %`;

/** VUE de la reconnaissance par photo (écrans 3b et 3d de la maquette). */
export function RecognitionScreen({ kind, onAccept }: { kind: CatalogKind; onAccept: (itemId: string) => void }) {
  const { uiState, takePhoto, pickPhoto, accept, close } = useRecognitionViewModel(kind, onAccept);
  const photoUri = uiState.status === 'noPhoto' ? null : uiState.photoUri;
  const [best, ...others] = uiState.status === 'done' ? uiState.results : [];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" color={colors.surface} accessibilityLabel="Retour" onPress={close} />
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {TITLES[kind]}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photoBox}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Photo à analyser" />
          ) : (
            <Ionicons name="camera-outline" size={56} color={colors.nightText} />
          )}
          {uiState.status === 'analyzing' && (
            <View style={styles.badge}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.badgeText}>Analyse par l’agent IA…</Text>
            </View>
          )}
          {uiState.status === 'done' && (
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
              <Text style={styles.badgeText}>Analysé par l’agent IA</Text>
            </View>
          )}
        </View>

        {uiState.status === 'noPhoto' && (
          <View style={styles.sheet}>
            <Text style={styles.sheetText}>Prenez une photo nette, de profil et en pleine lumière.</Text>
            <PrimaryButton icon="camera-outline" label="Prendre une photo" onPress={takePhoto} />
            <SecondaryButton icon="images-outline" label="Choisir dans la galerie" onPress={pickPhoto} />
          </View>
        )}

        {uiState.status === 'error' && (
          <View style={styles.sheet}>
            <Text accessibilityRole="alert" style={styles.sheetText}>
              {uiState.message}
            </Text>
            <PrimaryButton icon="camera-outline" label="Reprendre une photo" onPress={takePhoto} />
          </View>
        )}

        {uiState.status === 'done' && best && (
          <View style={styles.sheet}>
            <Text style={styles.overline}>Résultat</Text>
            <View style={styles.resultRow}>
              <View style={styles.resultNames}>
                <Text style={styles.resultName}>{best.item.name}</Text>
                {best.item.latinName && <Text style={styles.resultLatin}>{best.item.latinName}</Text>}
              </View>
              <Text style={styles.resultPercent}>{percent(best.confidence)}</Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityLabel={`Confiance ${percent(best.confidence)}`} style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(best.confidence * 100)}%` }]} />
            </View>
            {others.length > 0 && (
              <View style={styles.others}>
                <Text style={styles.othersLabel}>Autres possibilités :</Text>
                {others.map((result) => (
                  <Pressable
                    key={result.item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Choisir ${result.item.name}`}
                    onPress={() => accept(result)}
                    style={styles.otherChip}
                  >
                    <Text style={styles.otherText}>
                      {result.item.name} {percent(result.confidence)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.actions}>
              <SecondaryButton icon="camera-outline" label="Reprendre" onPress={takePhoto} flex />
              <PrimaryButton label={`Ajouter ${best.item.name.toLowerCase()}`} onPress={() => accept(best)} flex />
            </View>
            <Text style={styles.note}>Proposition de l’agent IA, à vérifier. Mode démo : résultats d’exemple.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PrimaryButton({ icon, label, onPress, flex }: { icon?: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; flex?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primary, flex && styles.flex1, pressed && styles.pressed]}>
      {icon && <Ionicons name={icon} size={18} color={colors.surface} />}
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ icon, label, onPress, flex }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; flex?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, flex && styles.flex1, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.surface },
  content: { padding: spacing.lg, paddingTop: spacing.sm, gap: 14, flexGrow: 1 },
  photoBox: {
    minHeight: 260,
    flexGrow: 1,
    borderRadius: 20,
    backgroundColor: '#1D5C62',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(12,52,56,0.85)',
  },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.surface },
  sheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 12 },
  sheetText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  overline: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted },
  resultRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  resultNames: { flex: 1, gap: 2 },
  resultName: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.ink },
  resultLatin: { fontFamily: fonts.body, fontSize: 14, fontStyle: 'italic', color: colors.muted },
  resultPercent: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.mine },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E3EAE9', overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.mine },
  others: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  othersLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  otherChip: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: colors.ground },
  otherText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  primary: {
    minHeight: 48,
    borderRadius: radius.md - 2,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  primaryLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
  secondary: {
    minHeight: 48,
    borderRadius: radius.md - 2,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  secondaryLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
  flex1: { flex: 1 },
  pressed: { opacity: 0.85 },
});
