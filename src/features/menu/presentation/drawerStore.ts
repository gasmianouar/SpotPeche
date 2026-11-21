import { create } from 'zustand';

/**
 * Le menu s'ouvre depuis la barre de l'accueil mais s'affiche au-dessus des
 * onglets : ces deux composants partagent donc son état via un petit store.
 */
interface DrawerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
