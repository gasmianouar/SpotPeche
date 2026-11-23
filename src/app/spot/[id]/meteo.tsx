import { useLocalSearchParams } from 'expo-router';

import { SpotWeatherScreen } from '@/features/fishingForecast/presentation/SpotWeatherScreen';

// Route « /spot/[id]/meteo » : météo et activité des poissons aux coordonnées GPS du spot.
export default function SpotWeatherRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpotWeatherScreen spotId={id} />;
}
