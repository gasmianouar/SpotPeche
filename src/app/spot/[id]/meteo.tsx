import { useLocalSearchParams, useRouter } from 'expo-router';

import { WeatherScreen } from '@/features/weather/presentation/WeatherScreen';

// Route « /spot/[id]/meteo?lat=…&lon=… » : l'écran Météo, pour l'endroit du spot.
export default function SpotWeatherRoute() {
  const router = useRouter();
  const { lat, lon } = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const latitude = Number(lat);
  const longitude = Number(lon);
  const valid = Number.isFinite(latitude) && Number.isFinite(longitude);
  return (
    <WeatherScreen
      latitude={valid ? latitude : undefined}
      longitude={valid ? longitude : undefined}
      onBack={() => router.back()}
    />
  );
}
