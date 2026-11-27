import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { CatchCard } from './components/CatchCard';
import { CatchViewer } from './components/CatchViewer';
import { useMyCatchesViewModel } from './useMyCatchesViewModel';

/** VUE « Mes prises » (écran 2d de la maquette) : les photos de mes prises, avec lieu et date. */
export function MyCatchesScreen() {
  const vm = useMyCatchesViewModel();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Retour" onPress={vm.back} />
        <View style={styles.headerTexts}>
          <Text accessibilityRole="header" style={styles.title}>
            Mes prises
          </Text>
          {vm.uiState.status === 'ready' && <Text style={styles.summary}>{vm.summary}</Text>}
        </View>
      </View>

      {vm.uiState.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {vm.uiState.status === 'error' && (
        <View style={styles.centered}>
          <Text accessibilityRole="alert" style={styles.message}>
            {vm.uiState.message}
          </Text>
          <Pressable accessibilityRole="button" onPress={vm.retry} style={styles.retry}>
            <Text style={styles.retryLabel}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {vm.uiState.status === 'ready' && (
        <FlatList
          data={vm.visible}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            // Contrôle segmenté : les trois filtres partagent la largeur, toujours sur une seule ligne.
            <View accessibilityRole="radiogroup" accessibilityLabel="Période" style={styles.periods}>
              {vm.periods.map((p) => {
                const selected = p.value === vm.period;
                return (
                  <Pressable
                    key={p.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => vm.setPeriod(p.value)}
                    style={[styles.period, selected && styles.periodSelected]}
                  >
                    <Text
                      style={[styles.periodLabel, selected && styles.periodLabelSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fish-outline" size={44} color={colors.primary} />
              <Text style={styles.emptyTitle}>
                {vm.uiState.catches.length === 0 ? 'Pas encore de prise' : 'Aucune prise sur cette période'}
              </Text>
              {vm.uiState.catches.length === 0 && (
                <Text style={styles.message}>
                  Publiez la photo d’une prise sur un spot (à sa création ou dans la discussion) : elle apparaîtra ici,
                  avec le lieu et la date.
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <CatchCard item={item} onPress={() => vm.open(item)} />
            </View>
          )}
        />
      )}

      <CatchViewer item={vm.opened} onClose={vm.close} onOpenSpot={vm.openSpot} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTexts: { flex: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  summary: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  message: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center' },
  retry: { minHeight: 44, paddingHorizontal: spacing.xl, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center' },
  retryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  list: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.md, flexGrow: 1 },
  row: { gap: spacing.md },
  cell: { flex: 1, maxWidth: '50%' },
  periods: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: spacing.xs,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  period: { flex: 1, minHeight: 40, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  periodSelected: { backgroundColor: colors.primary },
  periodLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  periodLabelSelected: { color: colors.surface },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink, textAlign: 'center' },
});
