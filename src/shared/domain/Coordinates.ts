/**
 * Une position GPS. Type du DOMAINE : il ne dépend d'aucune librairie
 * (ni MapLibre, ni expo-location). La conversion vers le format d'une
 * librairie se fait dans la couche présentation ou data.
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}
