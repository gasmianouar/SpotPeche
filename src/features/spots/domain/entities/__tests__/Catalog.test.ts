import { BAIT_CATALOG, findCatalogItems, SPECIES_CATALOG, speciesByHabitat } from '../Catalog';
import { catalogImage } from '../../../presentation/catalog/catalogImages';

describe('Catalogue', () => {
  it.each([
    ['espèces', SPECIES_CATALOG],
    ['appâts', BAIT_CATALOG],
  ])('les identifiants des %s sont uniques', (_label, catalog) => {
    const ids = catalog.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Les espèces marines auront la silhouette de leur famille (tâche 9 du plan) ; en attendant,
  // on vérifie les illustrations qui existent déjà : eau douce et appâts.
  it('chaque espèce d’eau douce et chaque appât a une illustration', () => {
    speciesByHabitat('fresh').forEach((item) => expect(catalogImage('species', item.id)).toBeDefined());
    BAIT_CATALOG.forEach((item) => expect(catalogImage('bait', item.id)).toBeDefined());
  });

  it('findCatalogItems garde l’ordre demandé et ignore les inconnus', () => {
    expect(findCatalogItems('species', ['perche', 'inconnu', 'brochet']).map((i) => i.id)).toEqual(['perche', 'brochet']);
  });

  it('contient surtout des espèces marines, et garde les 8 espèces d’eau douce', () => {
    expect(speciesByHabitat('sea').length).toBeGreaterThanOrEqual(45);
    expect(speciesByHabitat('fresh').map((s) => s.id)).toEqual(['brochet', 'sandre', 'perche', 'carpe', 'truite', 'blackbass', 'silure', 'gardon']);
  });

  it('donne à chaque espèce un nom latin unique, un milieu et une famille', () => {
    for (const s of SPECIES_CATALOG) {
      expect(s).toEqual(expect.objectContaining({ latinName: expect.any(String), habitat: expect.any(String), family: expect.any(String) }));
    }
    const latin = SPECIES_CATALOG.map((s) => s.latinName);
    expect(new Set(latin).size).toBe(latin.length);
  });

  it('connaît le bar, la daurade royale et le sar commun', () => {
    expect(findCatalogItems('species', ['bar', 'daurade', 'sar']).map((s) => s.latinName)).toEqual(['Dicentrarchus labrax', 'Sparus aurata', 'Diplodus sargus']);
  });

  it('les identifiants sont courts, en minuscules, sans accent ni espace', () => {
    SPECIES_CATALOG.forEach((s) => expect(s.id).toMatch(/^[a-z]+(-[a-z]+)*$/));
  });

  it('réunit les espèces jumelles sur photo : mulets, lieus et chinchards', () => {
    const [mulet, lieu, chinchard] = findCatalogItems('species', ['mulet', 'lieu', 'chinchard']);
    expect(mulet.members).toEqual(['Mugil cephalus', 'Chelon labrosus', 'Chelon auratus', 'Chelon ramada']);
    expect(lieu.members).toEqual(['Pollachius pollachius', 'Pollachius virens']);
    expect(chinchard.members).toHaveLength(2);
    expect(SPECIES_CATALOG).toHaveLength(60);
  });

  it('les appâts n’ont ni milieu ni famille', () => {
    BAIT_CATALOG.forEach((b) => expect(b.habitat ?? b.family).toBeUndefined());
  });
});
