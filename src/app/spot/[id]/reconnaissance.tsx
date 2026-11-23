import { useLocalSearchParams } from 'expo-router';

import { useSpotContributionStore } from '@/features/spots/presentation/contribute/spotContributionStore';
import { RecognitionScreen } from '@/features/spots/presentation/recognition/RecognitionScreen';

// Route « /spot/[id]/reconnaissance?type=especes|appats » : « Ajouter » coche la proposition
// dans les ajouts au spot (au lieu du brouillon de création).
export default function SpotRecognitionRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const add = useSpotContributionStore((s) => s.add);
  return <RecognitionScreen kind={type === 'appats' ? 'bait' : 'species'} onAccept={add} />;
}
