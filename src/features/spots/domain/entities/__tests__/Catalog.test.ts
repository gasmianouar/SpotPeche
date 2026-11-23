import { BAIT_CATALOG, findCatalogItems, SPECIES_CATALOG } from '../Catalog';
import { catalogImage } from '../../../presentation/catalog/catalogImages';

describe('Catalogue', () => {
  it.each([
    ['espèces', SPECIES_CATALOG],
    ['appâts', BAIT_CATALOG],
  ])('les identifiants des %s sont uniques', (_label, catalog) => {
    const ids = catalog.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque élément a une illustration', () => {
    SPECIES_CATALOG.forEach((item) => expect(catalogImage('species', item.id)).toBeDefined());
    BAIT_CATALOG.forEach((item) => expect(catalogImage('bait', item.id)).toBeDefined());
  });

  it('findCatalogItems garde l’ordre demandé et ignore les inconnus', () => {
    expect(findCatalogItems('species', ['perche', 'inconnu', 'brochet']).map((i) => i.id)).toEqual(['perche', 'brochet']);
  });
});
