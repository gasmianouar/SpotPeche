import { useSpotDraftStore } from '@/features/spots/presentation/create/spotDraftStore';
import { RecognitionScreen } from '@/features/spots/presentation/recognition/RecognitionScreen';

// Route « /nouveau-spot/reconnaissance » : reconnaître l'espèce sur une photo.
export default function RecognitionRoute() {
  const addItem = useSpotDraftStore((s) => s.addItem);
  // « Ajouter » coche l'espèce dans le brouillon du spot en création.
  return <RecognitionScreen onAccept={(id) => addItem('species', id)} />;
}
