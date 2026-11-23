import { useSpotContributionStore } from '@/features/spots/presentation/contribute/spotContributionStore';
import { RecognitionScreen } from '@/features/spots/presentation/recognition/RecognitionScreen';

// Route « /spot/[id]/reconnaissance » : reconnaître l'espèce sur une photo.
// « Ajouter » coche l'espèce dans les ajouts au spot (au lieu du brouillon de création).
export default function SpotRecognitionRoute() {
  const add = useSpotContributionStore((s) => s.add);
  return <RecognitionScreen onAccept={add} />;
}
