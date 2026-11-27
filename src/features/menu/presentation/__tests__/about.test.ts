jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

import { translate } from '@/core/i18n/translations';

import { CREDITS } from '../AboutScreen';
import { MENU_ITEMS } from '../menuItems';

describe('Composants open source', () => {
  it('n’encombre pas le menu (simple lien discret en bas)', () => {
    expect(MENU_ITEMS.map((i) => i.id)).not.toContain('about');
  });

  it('mentionne les licences des modèles embarqués, sans composant AGPL', () => {
    const text = CREDITS.map((c) => translate('fr', c.text)).join(' ');
    expect(text).toContain('licence MIT');
    expect(text).toContain('Apache 2.0');
    expect(text).toContain('RF-DETR');
    expect(text).not.toMatch(/AGPL|Ultralytics|YOLO/);
  });
});
