import { create } from 'zustand';

import type { User } from '../../domain/entities/User';

/**
 * État GLOBAL de la session (qui est connecté ?), partagé par toute l'app.
 * Zustand = un petit store : on lit avec useSessionStore(s => s.user),
 * on écrit avec setUser(...). Les écrans qui lisent `user` se redessinent
 * automatiquement quand il change.
 */
interface SessionState {
  user: User | null;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
