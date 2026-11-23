import { CatalogPickerScreen } from '@/features/spots/presentation/picker/CatalogPickerScreen';
import { useCatalogPickerViewModel } from '@/features/spots/presentation/picker/useCatalogPickerViewModel';

// Route « /nouveau-spot/appats » (à ne pas confondre avec « /appats », les magasins).
export default function BaitPickerRoute() {
  const vm = useCatalogPickerViewModel('bait');
  return <CatalogPickerScreen kind="bait" vm={vm} />;
}
