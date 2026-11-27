import { I18nManager } from 'react-native';

/** Icônes qui indiquent un sens (retour, suivant) : en arabe (droite à gauche), on les retourne. */
const DIRECTIONAL = /^(chevron|arrow|caret)-(back|forward)/;

export const flipIfRtl = (icon: string) => (I18nManager.isRTL && DIRECTIONAL.test(icon) ? { transform: [{ scaleX: -1 }] } : undefined);
