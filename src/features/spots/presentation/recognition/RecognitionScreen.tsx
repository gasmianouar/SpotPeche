import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { catalogName } from '../catalog/catalogName';
import { recognitionNoteText } from './recognitionNotes';
import { useRecognitionViewModel } from './useRecognitionViewModel';

const percent = (confidence: number) => `${Math.round(confidence * 100)} %`;

/** VUE de la reconnaissance de l'espèce par photo (écran 3b de la maquette). */
export function RecognitionScreen({ onAccept }: { onAccept: (itemId: string) => void }) {
  const { t, language } = useI18n();
  const { uiState, takePhoto, pickPhoto, accept, close } = useRecognitionViewModel(onAccept);
  const photoUri = uiState.status === 'noPhoto' ? null : uiState.photoUri;
  const [best, ...others] = uiState.status === 'done' ? uiState.results : [];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" color={colors.surface} accessibilityLabel={t('common.back')} onPress={close} />
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {t('recognition.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photoBox}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={t('recognition.photoA11y')} />
          ) : (
            <Ionicons name="camera-outline" size={56} color={colors.nightText} />
          )}
          {uiState.status === 'analyzing' && (
            <View style={styles.badge}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.badgeText}>{t('recognition.analyzing')}</Text>
            </View>
          )}
          {uiState.status === 'done' && (
            <View style={styles.badge}>
              <Ionicons name={uiState.isDemo ? 'flask-outline' : 'sparkles'} size={14} color={colors.accent} />
              <Text style={styles.badgeText}>{uiState.isDemo ? t('recognition.demoBadge') : t('recognition.onDeviceBadge')}</Text>
            </View>
          )}
        </View>

        {uiState.status === 'noPhoto' && (
          <View style={styles.sheet}>
            <Text style={styles.sheetText}>{t('recognition.tips')}</Text>
            <PrimaryButton icon="camera-outline" label={t('create.takePhoto')} onPress={takePhoto} />
            <SecondaryButton icon="images-outline" label={t('create.pickPhotos')} onPress={pickPhoto} />
          </View>
        )}

        {uiState.status === 'error' && (
          <View style={styles.sheet}>
            {uiState.unavailable && <Ionicons name="cloud-offline-outline" size={28} color={colors.accent} style={styles.limitIcon} />}
            <Text accessibilityRole="alert" style={styles.sheetText}>
              {recognitionNoteText(uiState.message, t)}
            </Text>
            {uiState.unavailable ? (
              <PrimaryButton icon="list-outline" label={t('recognition.pickFromList')} onPress={close} />
            ) : (
              <PrimaryButton icon="camera-outline" label={t('recognition.retake')} onPress={takePhoto} />
            )}
          </View>
        )}

        {uiState.status === 'done' && best && (
          <View style={styles.sheet}>
            <Text style={styles.overline}>{t('recognition.result')}</Text>
            <View style={styles.resultRow}>
              <View style={styles.resultNames}>
                <Text style={styles.resultName}>{catalogName(best.item, language)}</Text>
                {best.item.latinName && <Text style={styles.resultLatin}>{best.item.latinName}</Text>}
              </View>
              <Text style={styles.resultPercent}>{percent(best.confidence)}</Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityLabel={t('recognition.confidence', { percent: percent(best.confidence) })} style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(best.confidence * 100)}%` }]} />
            </View>
            {others.length > 0 && (
              <View style={styles.others}>
                <Text style={styles.othersLabel}>{t('recognition.others')}</Text>
                {others.map((result) => (
                  <Pressable
                    key={result.item.id}
                    accessibilityRole="button"
                    accessibilityLabel={t('recognition.chooseA11y', { name: catalogName(result.item, language) })}
                    onPress={() => accept(result)}
                    style={styles.otherChip}
                  >
                    <Text style={styles.otherText}>
                      {catalogName(result.item, language)} {percent(result.confidence)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.actions}>
              <SecondaryButton icon="camera-outline" label={t('recognition.retakeShort')} onPress={takePhoto} flex />
              <PrimaryButton label={t('recognition.add', { name: language === 'fr' ? catalogName(best.item, language).toLowerCase() : catalogName(best.item, language) })} onPress={() => accept(best)} flex />
            </View>
            {uiState.note && !uiState.isDemo && <Text style={styles.agentNote}>« {recognitionNoteText(uiState.note, t)} »</Text>}
            <Text style={styles.note}>
              {uiState.isDemo
                ? t('recognition.demoNote')
                : t('recognition.verifyNote')}
            </Text>
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
  limitIcon: { alignSelf: 'center' },
  agentNote: { fontFamily: fonts.body, fontSize: 13, fontStyle: 'italic', color: colors.ink },
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
