import { useLocalSearchParams } from 'expo-router';

import { useSpotDraftStore } from '@/features/spots/presentation/create/spotDraftStore';
import { RecognitionScreen } from '@/features/spots/presentation/recognition/RecognitionScreen';

// Route « /nouveau-spot/reconnaissance?type=especes|appats ».
export default function RecognitionRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const kind = type === 'appats' ? 'bait' : 'species';
  const addItem = useSpotDraftStore((s) => s.addItem);
  // « Ajouter » coche la proposition dans le brouillon du spot en création.
  return <RecognitionScreen kind={kind} onAccept={(id) => addItem(kind, id)} />;
}
