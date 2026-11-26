import { SPECIES_CATALOG } from '../../../domain/entities/Catalog';
import { catalogImage, familyImage } from '../catalogImages';

describe('catalogImage', () => {
  it('donne une image à chaque espèce du catalogue', () => {
    SPECIES_CATALOG.forEach((s) => expect(catalogImage('species', s.id)).toBeDefined());
  });

  it('affiche la silhouette de sa famille pour une espèce sans dessin propre', () => {
    expect(catalogImage('species', 'daurade')).toBe(familyImage('sparid'));
    expect(catalogImage('species', 'mulet')).toBe(familyImage('mullet'));
    expect(catalogImage('species', 'congre')).toBe(familyImage('eel'));
  });

  it('garde le dessin propre des espèces d’eau douce', () => {
    expect(catalogImage('species', 'brochet')).not.toBe(familyImage('freshwater'));
    expect(catalogImage('species', 'brochet')).toBeDefined();
  });

  it('ne renvoie rien pour un identifiant inconnu', () => {
    expect(catalogImage('species', 'inconnu')).toBeUndefined();
  });
});
