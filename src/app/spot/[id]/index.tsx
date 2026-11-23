import { useLocalSearchParams } from 'expo-router';

import { SpotDetailScreen } from '@/features/spots/presentation/detail/SpotDetailScreen';

// Route « /spot/[id] » : [id] est un segment dynamique (ex. /spot/s1 → id = 's1').
export default function SpotDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpotDetailScreen spotId={id} />;
}
