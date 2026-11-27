import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius } from '@/core/theme/tokens';

import { catalogName } from '../../catalog/catalogName';
import type { CatalogItem, CatalogKind } from '../../../domain/entities/Catalog';
import { catalogImage } from '../../catalog/catalogImages';

interface Props {
  kind: CatalogKind;
  title: string;
  items: CatalogItem[];
  onChoose: () => void;
}

/** Bloc « Espèces présentes » / « Appâts utilisés » : vignettes choisies + bouton Choisir. */
export function CatalogSelection({ kind, title, items, onChoose }: Props) {
  const { t, language } = useI18n();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {items.length > 0 && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onChoose}>
            <Text style={styles.link}>{t('create.edit')}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.row}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.thumb}>
              <Image source={catalogImage(kind, item.id)} style={styles.thumbImage} resizeMode="contain" />
            </View>
            <Text style={styles.itemLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {catalogName(item, language)}
            </Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('create.choose', { title })}
          onPress={onChoose}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={[styles.thumb, styles.addThumb]}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.itemLabel, styles.addLabel]}>{t('create.chooseShort')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { width: 72, alignItems: 'center', gap: 6 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F1F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: 56, height: 28 },
  addThumb: { backgroundColor: colors.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: '#8FA5A7' },
  itemLabel: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink, textAlign: 'center' },
  addLabel: { color: colors.primary },
  pressed: { opacity: 0.7 },
});
