import { filterCatalog } from '../useCatalogPickerViewModel';

describe('filterCatalog', () => {
  it('ne montre que les espèces marines avec le filtre « Mer »', () => {
    const items = filterCatalog('species', '', 'sea');
    expect(items.length).toBeGreaterThanOrEqual(45);
    items.forEach((i) => expect(i.habitat).toBe('sea'));
  });

  it('ne montre que les 8 espèces d’eau douce avec le filtre « Eau douce »', () => {
    expect(filterCatalog('species', '', 'fresh')).toHaveLength(8);
  });

  it('« Tout » montre les 60 espèces', () => {
    expect(filterCatalog('species', '', 'all')).toHaveLength(60);
  });

  it('une recherche par nom cherche dans tous les milieux', () => {
    expect(filterCatalog('species', 'brochet', 'sea').map((i) => i.id)).toEqual(['brochet']);
  });

  it('trouve un groupe par le nom latin d’un de ses membres', () => {
    expect(filterCatalog('species', 'chelon', 'all').map((i) => i.id)).toEqual(['mulet']);
  });

  it('ignore le milieu pour les appâts', () => {
    expect(filterCatalog('bait', '', 'sea')).toHaveLength(8);
  });
});
