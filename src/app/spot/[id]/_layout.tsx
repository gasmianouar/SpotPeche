import { Stack } from 'expo-router';

/**
 * Fiche d'un spot : une pile d'écrans à part.
 *   /spot/s1                → la fiche
 *   /spot/s1/ajouter        → ajouter des espèces ou des appâts (?type=especes|appats)
 *   /spot/s1/reconnaissance → photo de la prise → espèce reconnue
 *   /spot/s1/meteo          → la météo à l'endroit du spot (?lat=…&lon=…)
 *   /spot/s1/signaler       → signaler le spot ou bloquer son créateur (?message=… pour un message)
 */
export default function SpotLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
