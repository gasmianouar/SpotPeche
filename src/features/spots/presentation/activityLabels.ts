import type { TranslationKey } from '@/core/i18n/translations';

import type { FishActivity } from '../domain/entities/Spot';

/** Les 3 niveaux d'activité, présentés avec un emoji (choix de design de la maquette). */
export const ACTIVITY_OPTIONS: readonly { value: FishActivity; emoji: string; label: TranslationKey }[] = [
  { value: 'good', emoji: '🤩', label: 'activity.good' },
  { value: 'medium', emoji: '😐', label: 'activity.medium' },
  { value: 'none', emoji: '😴', label: 'activity.none' },
];

export const activityOption = (value: FishActivity | null) => ACTIVITY_OPTIONS.find((o) => o.value === value) ?? null;
