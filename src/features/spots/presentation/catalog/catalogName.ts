import type { Language } from '@/core/i18n/languages';
import { hasTranslation, translate } from '@/core/i18n/translations';

import type { CatalogItem } from '../../domain/entities/Catalog';

/** Le nom d'une espèce ou d'un appât dans la langue de l'app (le nom français si aucune traduction). */
export function catalogName(item: Pick<CatalogItem, 'id' | 'name'>, language: Language): string {
  const key = `catalog.${item.id}`;
  return hasTranslation(key) ? translate(language, key) : item.name;
}
