import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import type { CatalogKind } from '../../domain/entities/Catalog';
import { catalogImage } from '../catalog/catalogImages';
import type { CatalogPickerVm, HabitatFilter } from './CatalogPickerVm';

const HABITATS: { value: HabitatFilter; label: string }[] = [
  { value: 'sea', label: 'Mer' },
  { value: 'fresh', label: 'Eau douce' },
  { value: 'all', label: 'Tout' },
];

/** Textes propres à chaque catalogue : le composant reste le même pour les deux. */
const COPY: Record<CatalogKind, { title: string; intro: string; search: string }> = {
  species: {
    title: 'Espèces présentes',
    intro: 'Touchez les espèces vues ou pêchées sur ce spot, puis validez avec OK.',
    search: 'Rechercher une espèce',
  },
  bait: {
    title: 'Appâts utilisés',
    intro: 'Touchez les appâts et leurres qui fonctionnent sur ce spot, puis validez avec OK.',
    search: 'Rechercher un appât',
  },
};

/** VUE de choix des espèces ou des appâts (écrans 3a et 3c de la maquette). */
export function CatalogPickerScreen({ kind, vm }: { kind: CatalogKind; vm: CatalogPickerVm }) {
  const copy = COPY[kind];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Retour" onPress={vm.cancel} />
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {copy.title}
        </Text>
      </View>

      <FlatList
        data={vm.items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.top}>
            <Text style={styles.intro}>{copy.intro}</Text>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                accessibilityLabel={copy.search}
                value={vm.query}
                onChangeText={vm.setQuery}
                placeholder={copy.search}
                placeholderTextColor="#6A7D80"
                style={styles.searchInput}
              />
            </View>
            {vm.setHabitat && !vm.query.trim() && (
              <View style={styles.habitats} accessibilityRole="radiogroup">
                {HABITATS.map(({ value, label }) => {
                  const active = vm.habitat === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => vm.setHabitat?.(value)}
                      style={({ pressed }) => [styles.habitat, active && styles.habitatActive, pressed && styles.pressed]}
                    >
                      <Text style={[styles.habitatLabel, active && styles.habitatLabelActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {vm.recognize && (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={vm.recognize}
                  style={({ pressed }) => [styles.recognize, pressed && styles.pressed]}
                >
                  <Ionicons name="camera-outline" size={20} color={colors.surface} />
                  <Text style={styles.recognizeLabel}>Reconnaître l’espèce</Text>
                  <Ionicons name="sparkles" size={16} color={colors.accent} />
                </Pressable>
                <Text style={styles.hint}>Pas sûr de l’espèce ? Photographiez votre prise : le téléphone propose l’espèce, même sans réseau.</Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun résultat pour « {vm.query} ».</Text>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.selected, disabled: item.locked }}
            accessibilityLabel={item.locked ? `${item.name}, déjà sur le spot` : item.name}
            disabled={item.locked}
            onPress={() => vm.toggle(item.id)}
            style={[styles.card, item.selected && styles.cardSelected, item.locked && styles.cardLocked]}
          >
            <View style={styles.art}>
              <Image source={catalogImage(kind, item.id)} style={styles.artImage} resizeMode="contain" />
              {item.selected && (
                <View style={[styles.check, item.locked && styles.checkLocked]}>
                  <Ionicons name="checkmark" size={16} color={colors.surface} />
                </View>
              )}
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.locked ? 'Déjà sur le spot' : (item.latinName ?? (item.selected ? 'Sélectionné' : 'Toucher pour choisir'))}
            </Text>
          </Pressable>
        )}
      />

      {vm.error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {vm.error}
        </Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.count}>{vm.countLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: vm.isSaving, disabled: vm.isSaving }}
          disabled={vm.isSaving}
          onPress={vm.confirm}
          style={({ pressed }) => [styles.ok, pressed && styles.pressed]}
        >
          {vm.isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.okLabel}>{vm.confirmLabel}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
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
  list: { padding: spacing.lg, gap: 12 },
  columns: { gap: 12 },
  top: { gap: 10, marginBottom: 4 },
  intro: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  search: {
    height: 44,
    borderRadius: radius.md - 2,
    borderWidth: 1.5,
    borderColor: '#C9D5D4',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  habitats: { flexDirection: 'row', gap: spacing.sm },
  habitat: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitatActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  habitatLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  habitatLabelActive: { color: colors.surface },
  recognize: {
    minHeight: 48,
    borderRadius: radius.md - 2,
    backgroundColor: colors.night,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  recognizeLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    flex: 1,
    padding: 6,
    gap: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: colors.primary },
  cardLocked: { borderColor: colors.border },
  art: { height: 92, borderRadius: 12, backgroundColor: '#E8F1F2', alignItems: 'center', justifyContent: 'center' },
  artImage: { width: 120, height: 60 },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLocked: { backgroundColor: colors.muted },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B42318', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, paddingHorizontal: 4 },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, paddingHorizontal: 4, paddingBottom: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  count: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  ok: { minWidth: 120, height: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  okLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.surface },
  pressed: { opacity: 0.85 },
});
