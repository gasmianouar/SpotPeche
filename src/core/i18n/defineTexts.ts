import type { Language } from './languages';

/**
 * Les textes d'une partie de l'app, dans les 3 langues.
 * Le français sert de référence : l'anglais et l'arabe doivent avoir EXACTEMENT les mêmes clés
 * (TypeScript refuse une clé manquante ou en trop).
 * Chaque feature garde ses textes à côté de ses écrans (fichier `texts.ts`).
 */
export type Texts<K extends string> = Record<Language, Record<K, string>>;

export function defineTexts<K extends string>(texts: { fr: Record<K, string>; en: Record<K, string>; ar: Record<K, string> }): Texts<K> {
  return texts;
}
