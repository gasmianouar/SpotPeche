import type { FishActivity } from '../domain/entities/Spot';

/** Les 3 niveaux d'activité, présentés avec un emoji (choix de design de la maquette). */
export const ACTIVITY_OPTIONS: readonly { value: FishActivity; emoji: string; label: string }[] = [
  { value: 'good', emoji: '🤩', label: 'Ça mord bien' },
  { value: 'medium', emoji: '😐', label: 'Moyen' },
  { value: 'none', emoji: '😴', label: 'Nul' },
];

export const activityOption = (value: FishActivity | null) => ACTIVITY_OPTIONS.find((o) => o.value === value) ?? null;
