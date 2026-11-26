/**
 * Données de référence : les espèces de poissons et les appâts que l'on peut
 * associer à un spot. Le domaine ne connaît que des identifiants et des noms ;
 * les illustrations sont choisies par la couche présentation.
 *
 * Les utilisateurs pêchent surtout en MER (Méditerranée, Atlantique, Manche) :
 * le catalogue est majoritairement marin, et garde les 8 espèces d'eau douce d'origine.
 * Le nom latin sert aussi à la reconnaissance par photo (il fait le lien avec le modèle).
 */
export type CatalogKind = 'species' | 'bait';

/** Milieu de vie d'une espèce. */
export type Habitat = 'sea' | 'fresh';

/** Famille d'une espèce : sert à choisir sa silhouette quand elle n'a pas de dessin propre. */
export type SpeciesFamily =
  | 'bass'
  | 'sparid'
  | 'mullet'
  | 'mackerel'
  | 'gadid'
  | 'wrasse'
  | 'flatfish'
  | 'eel'
  | 'scorpionfish'
  | 'cephalopod'
  | 'shark'
  | 'freshwater'
  | 'other';

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  /** Nom scientifique (espèces seulement). */
  readonly latinName?: string;
  /** Milieu (espèces seulement). */
  readonly habitat?: Habitat;
  /** Famille (espèces seulement). */
  readonly family?: SpeciesFamily;
  /**
   * Pour un GROUPE d'espèces quasi jumelles sur photo (mulets, lieus, chinchards) : les noms latins réunis.
   * La reconnaissance par photo ne sait pas les distinguer de façon fiable ; le catalogue les présente donc ensemble.
   */
  readonly members?: readonly string[];
}

const sea = (id: string, name: string, latinName: string, family: SpeciesFamily): CatalogItem => ({ id, name, latinName, habitat: 'sea', family });
const fresh = (id: string, name: string, latinName: string): CatalogItem => ({ id, name, latinName, habitat: 'fresh', family: 'freshwater' });
const group = (id: string, name: string, latinName: string, family: SpeciesFamily, members: string[]): CatalogItem => ({
  ...sea(id, name, latinName, family),
  members,
});

export const SPECIES_CATALOG: readonly CatalogItem[] = [
  // Mer : bars
  sea('bar', 'Bar (loup)', 'Dicentrarchus labrax', 'bass'),
  sea('bar-mouchete', 'Bar moucheté', 'Dicentrarchus punctatus', 'bass'),
  // Mer : sparidés
  sea('daurade', 'Daurade royale', 'Sparus aurata', 'sparid'),
  sea('sar', 'Sar commun', 'Diplodus sargus', 'sparid'),
  sea('sar-tete-noire', 'Sar à tête noire', 'Diplodus vulgaris', 'sparid'),
  sea('sar-tambour', 'Sar tambour', 'Diplodus cervinus', 'sparid'),
  sea('sar-museau-pointu', 'Sar à museau pointu', 'Diplodus puntazzo', 'sparid'),
  sea('sparaillon', 'Sparaillon', 'Diplodus annularis', 'sparid'),
  sea('marbre', 'Marbré', 'Lithognathus mormyrus', 'sparid'),
  sea('pageot', 'Pageot commun', 'Pagellus erythrinus', 'sparid'),
  sea('pageot-acarne', 'Pageot acarné', 'Pagellus acarne', 'sparid'),
  sea('griset', 'Griset (dorade grise)', 'Spondyliosoma cantharus', 'sparid'),
  sea('pagre', 'Pagre', 'Pagrus pagrus', 'sparid'),
  sea('dente', 'Denté', 'Dentex dentex', 'sparid'),
  sea('saupe', 'Saupe', 'Sarpa salpa', 'sparid'),
  sea('oblade', 'Oblade', 'Oblada melanura', 'sparid'),
  sea('bogue', 'Bogue', 'Boops boops', 'sparid'),
  // Mer : mulets
  group('mulet', 'Mulet', 'Mugilidae', 'mullet', ['Mugil cephalus', 'Chelon labrosus', 'Chelon auratus', 'Chelon ramada']),
  // Mer : maquereaux, thons et poissons de pleine eau
  sea('maquereau', 'Maquereau', 'Scomber scombrus', 'mackerel'),
  sea('maquereau-espagnol', 'Maquereau espagnol', 'Scomber colias', 'mackerel'),
  group('chinchard', 'Chinchard', 'Trachurus', 'mackerel', ['Trachurus trachurus', 'Trachurus mediterraneus']),
  sea('bonite', 'Bonite à dos rayé', 'Sarda sarda', 'mackerel'),
  sea('thon-rouge', 'Thon rouge', 'Thunnus thynnus', 'mackerel'),
  sea('liche', 'Liche amie', 'Lichia amia', 'mackerel'),
  sea('seriole', 'Sériole', 'Seriola dumerili', 'mackerel'),
  sea('barracuda', 'Barracuda européen', 'Sphyraena sphyraena', 'mackerel'),
  sea('becune', 'Bécune à bouche jaune', 'Sphyraena viridensis', 'mackerel'),
  sea('orphie', 'Orphie', 'Belone belone', 'mackerel'),
  sea('tassergal', 'Tassergal', 'Pomatomus saltatrix', 'mackerel'),
  // Mer : gadidés
  group('lieu', 'Lieu (jaune ou noir)', 'Pollachius', 'gadid', ['Pollachius pollachius', 'Pollachius virens']),
  sea('merlan', 'Merlan', 'Merlangius merlangus', 'gadid'),
  sea('tacaud', 'Tacaud', 'Trisopterus luscus', 'gadid'),
  sea('cabillaud', 'Cabillaud', 'Gadus morhua', 'gadid'),
  // Mer : labres
  sea('vieille', 'Vieille', 'Labrus bergylta', 'wrasse'),
  sea('labre-mele', 'Labre mêlé', 'Labrus mixtus', 'wrasse'),
  sea('crenilabre', 'Crénilabre paon', 'Symphodus tinca', 'wrasse'),
  sea('girelle', 'Girelle', 'Coris julis', 'wrasse'),
  // Mer : poissons plats
  sea('sole', 'Sole', 'Solea solea', 'flatfish'),
  sea('plie', 'Plie (carrelet)', 'Pleuronectes platessa', 'flatfish'),
  sea('turbot', 'Turbot', 'Scophthalmus maximus', 'flatfish'),
  // Mer : congres et murènes
  sea('congre', 'Congre', 'Conger conger', 'eel'),
  sea('murene', 'Murène', 'Muraena helena', 'eel'),
  // Mer : rascasses, rougets et poissons de roche
  sea('rascasse', 'Rascasse brune', 'Scorpaena porcus', 'scorpionfish'),
  sea('rouget', 'Rouget de roche', 'Mullus surmuletus', 'scorpionfish'),
  sea('vive', 'Grande vive', 'Trachinus draco', 'scorpionfish'),
  sea('merou', 'Mérou brun', 'Epinephelus marginatus', 'other'),
  sea('serran', 'Serran écriture', 'Serranus scriba', 'other'),
  sea('corb', 'Corb', 'Sciaena umbra', 'other'),
  sea('maigre', 'Maigre', 'Argyrosomus regius', 'other'),
  // Mer : requins et céphalopodes
  sea('roussette', 'Petite roussette', 'Scyliorhinus canicula', 'shark'),
  sea('seiche', 'Seiche', 'Sepia officinalis', 'cephalopod'),
  sea('calmar', 'Calmar', 'Loligo vulgaris', 'cephalopod'),
  // Eau douce (catalogue d'origine, mêmes identifiants)
  fresh('brochet', 'Brochet', 'Esox lucius'),
  fresh('sandre', 'Sandre', 'Sander lucioperca'),
  fresh('perche', 'Perche', 'Perca fluviatilis'),
  fresh('carpe', 'Carpe', 'Cyprinus carpio'),
  fresh('truite', 'Truite', 'Salmo trutta'),
  fresh('blackbass', 'Black-bass', 'Micropterus salmoides'),
  fresh('silure', 'Silure', 'Silurus glanis'),
  fresh('gardon', 'Gardon', 'Rutilus rutilus'),
];

export const BAIT_CATALOG: readonly CatalogItem[] = [
  { id: 'worm', name: 'Ver de terre' },
  { id: 'maggot', name: 'Asticots' },
  { id: 'corn', name: 'Maïs' },
  { id: 'boilie', name: 'Bouillette' },
  { id: 'shad', name: 'Leurre souple' },
  { id: 'spoon', name: 'Cuillère' },
  { id: 'crank', name: 'Poisson nageur' },
  { id: 'fly', name: 'Mouche' },
];

export function catalogFor(kind: CatalogKind): readonly CatalogItem[] {
  return kind === 'species' ? SPECIES_CATALOG : BAIT_CATALOG;
}

/** Les espèces d'un milieu, dans l'ordre du catalogue. */
export function speciesByHabitat(habitat: Habitat): readonly CatalogItem[] {
  return SPECIES_CATALOG.filter((item) => item.habitat === habitat);
}

/** Retrouve des éléments du catalogue par leurs identifiants, en ignorant les inconnus. */
export function findCatalogItems(kind: CatalogKind, ids: readonly string[]): CatalogItem[] {
  const catalog = catalogFor(kind);
  return ids.map((id) => catalog.find((item) => item.id === id)).filter((item): item is CatalogItem => !!item);
}
