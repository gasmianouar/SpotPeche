import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import type { CatalogItem, CatalogKind } from '../../../domain/entities/Catalog';
import { catalogName } from '../../catalog/catalogName';
import { catalogImage } from '../../catalog/catalogImages';

interface Props {
  species: readonly CatalogItem[];
  baits: readonly CatalogItem[];
  onAdd: (kind: CatalogKind) => void;
}

/** Une seule carte compacte : « Prises » puis « Appâts », séparées par un trait. */
export function SpotItemsCard({ species, baits, onAdd }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.card}>
      <ItemsRow kind="species" title={t('detail.catches')} addLabel={t('detail.addCatch')} items={species} onAdd={() => onAdd('species')} />
      <View style={styles.separator} />
      <ItemsRow kind="bait" title={t('detail.baits')} addLabel={t('detail.addBait')} items={baits} onAdd={() => onAdd('bait')} />
    </View>
  );
}

interface RowProps {
  kind: CatalogKind;
  title: string;
  addLabel: string;
  items: readonly CatalogItem[];
  onAdd: () => void;
}

/**
 * Une liste de vignettes repliable :
 * - repliée (par défaut) : une ligne qui défile, la carte garde la même hauteur ;
 * - dépliée : toutes les vignettes, sur plusieurs lignes.
 * Ouvert / fermé est un simple état d'affichage : il reste dans la vue (useState).
 */
function ItemsRow({ kind, title, addLabel, items, onAdd }: RowProps) {
  const { t, language } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const thumbnails = items.map((item) => (
    <View key={item.id} style={styles.item}>
      <View style={styles.thumb}>
        <Image source={catalogImage(kind, item.id)} style={styles.thumbImage} resizeMode="contain" />
      </View>
      <Text style={styles.itemLabel} numberOfLines={1}>
        {catalogName(item, language)}
      </Text>
    </View>
  ));

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title} <Text style={styles.count}>· {items.length}</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          onPress={onAdd}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={16} color="#0A434A" />
          <Text style={styles.addLabel}>{t('common.add')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={t(expanded ? 'detail.collapse' : 'detail.expand', { title })}
          onPress={() => setExpanded((e) => !e)}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
        >
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#0A434A" />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>{t('detail.nothingYet')}</Text>
      ) : expanded ? (
        <View style={styles.wrap}>{thumbnails}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.line}>
          {thumbnails}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: spacing.lg, gap: spacing.md },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  block: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  count: { fontFamily: fonts.bodySemiBold, color: colors.muted },
  add: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#0A434A' },
  toggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  line: { gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: spacing.sm },
  item: { width: 56, alignItems: 'center', gap: 3 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F1F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: 42, height: 21 },
  itemLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.ink, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
