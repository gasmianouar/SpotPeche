import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { DEFAULT_POSITION } from '@/core/location/LocationService';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { DESCRIPTION_MAX_LENGTH } from '../../domain/usecases/CreateSpot';
import { ActivitySelector } from './components/ActivitySelector';
import { CatalogSelection } from './components/CatalogSelection';
import { CommentComposer } from './components/CommentComposer';
import { LocationPicker } from './components/LocationPicker';

import { useCreateSpotViewModel } from './useCreateSpotViewModel';

/** VUE de l'écran « Nouveau spot » (écran 3 de la maquette). */
export function CreateSpotScreen() {
  const vm = useCreateSpotViewModel();
  const { t } = useI18n();
  const { draft, errors } = vm;
  // Défilement coupé tant que le doigt est sur la mini-carte (état purement visuel : il reste dans la vue).
  const [scrollEnabled, setScrollEnabled] = useState(true);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel={t('common.back')} onPress={vm.cancel} />
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {t('create.title')}
        </Text>
      </View>

      {/* Le clavier ne doit pas cacher le commentaire. « padding » sur les deux plateformes :
          avec l'affichage bord à bord d'Android (Expo 58), l'écran ne rétrécit plus tout seul. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
        >
          <LocationPicker
            initialCenter={draft.coordinates ?? DEFAULT_POSITION}
            coordinates={draft.coordinates}
            positionSource={draft.positionSource}
            accuracyMeters={draft.accuracyMeters}
            isLocating={vm.isLocating}
            error={errors.coordinates}
            onMapMoved={vm.onMapMoved}
            onMapTouch={(touching) => setScrollEnabled(!touching)}
          />

          <CatalogSelection
            kind="species"
            title={t('create.species')}
            items={draft.species}
            onChoose={() => vm.openPicker('species')}
          />
          <CatalogSelection
            kind="bait"
            title={t('create.baits')}
            items={draft.baits}
            onChoose={() => vm.openPicker('bait')}
          />

          <ActivitySelector value={draft.activity} onChange={vm.setActivity} />

          <CommentComposer
            value={draft.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            photoUris={draft.photoUris}
            canAddPhotos={vm.canAddPhotos}
            error={errors.description}
            onChangeText={vm.setDescription}
            onTakePhoto={vm.takePhoto}
            onPickPhotos={vm.pickPhotos}
            onRemovePhoto={vm.removePhoto}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {errors.general && (
          <Text accessibilityRole="alert" style={styles.error}>
            {errors.general}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: vm.isSaving, disabled: vm.isSaving }}
          disabled={vm.isSaving}
          onPress={vm.save}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          {vm.isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveLabel}>{t('create.save')}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  flex: { flex: 1 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B42318' },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.surface },
  pressed: { opacity: 0.85 },
});
