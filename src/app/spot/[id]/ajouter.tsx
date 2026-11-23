import { useLocalSearchParams } from 'expo-router';

import { useSpotItemsPickerViewModel } from '@/features/spots/presentation/contribute/useSpotItemsPickerViewModel';
import { CatalogPickerScreen } from '@/features/spots/presentation/picker/CatalogPickerScreen';

// Route « /spot/[id]/ajouter?type=especes|appats » : même écran de choix que la création,
// avec un autre ViewModel (ce qui existe est verrouillé, on ne fait qu'ajouter).
export default function AddSpotItemsRoute() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const kind = type === 'appats' ? 'bait' : 'species';
  const vm = useSpotItemsPickerViewModel(id, kind);
  return <CatalogPickerScreen kind={kind} vm={vm} />;
}
