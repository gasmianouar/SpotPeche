import { CatalogPickerScreen } from '@/features/spots/presentation/picker/CatalogPickerScreen';
import { useCatalogPickerViewModel } from '@/features/spots/presentation/picker/useCatalogPickerViewModel';

// Route « /nouveau-spot/especes » : même écran que les appâts, paramétré par `kind`.
export default function SpeciesPickerRoute() {
  const vm = useCatalogPickerViewModel('species');
  return <CatalogPickerScreen kind="species" vm={vm} />;
}
