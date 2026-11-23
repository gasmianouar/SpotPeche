import { Stack } from 'expo-router';

/**
 * Parcours « Nouveau spot » : une pile d'écrans à part.
 *   /nouveau-spot                → formulaire
 *   /nouveau-spot/especes        → choix des espèces
 *   /nouveau-spot/appats         → choix des appâts
 *   /nouveau-spot/reconnaissance → photo + agent IA (?type=especes|appats)
 */
export default function NewSpotLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
