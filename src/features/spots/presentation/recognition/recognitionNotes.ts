import type { TranslationKey } from '@/core/i18n/translations';

import { NO_FISH_NOTE } from '../../data/recognition/OnDeviceImageRecognizer';
import { UNSURE_NOTE } from '../../domain/recognition/scoreSpecies';
import { UNAVAILABLE_MESSAGE } from './useRecognitionViewModel';

/**
 * Les messages de la reconnaissance sont des phrases françaises fixes (domaine, données) :
 * on les traduit ici. Un texte inconnu reste tel quel.
 */
const NOTES: Record<string, TranslationKey> = {
  [UNSURE_NOTE]: 'recognition.unsure',
  [NO_FISH_NOTE]: 'recognition.noFish',
  [UNAVAILABLE_MESSAGE]: 'recognition.unavailable',
};

export function recognitionNoteText(note: string, t: (key: TranslationKey) => string): string {
  const key = NOTES[note];
  return key ? t(key) : note;
}
