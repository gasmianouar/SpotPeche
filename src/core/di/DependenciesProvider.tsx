import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createDependencies, type Dependencies } from './container';

/**
 * Un Context React rend les dépendances accessibles à tous les écrans,
 * sans les passer de composant en composant.
 */
const DependenciesContext = createContext<Dependencies | null>(null);

export function DependenciesProvider({
  children,
  dependencies,
}: {
  children: ReactNode;
  /** Permet d'injecter des faux dans les tests. */
  dependencies?: Dependencies;
}) {
  // Créé une seule fois (tant que `dependencies` ne change pas).
  // useMemo plutôt que useState : en développement, Fast Refresh recalcule les useMemo,
  // donc un nouveau cas d'usage ajouté dans container.ts est pris en compte sans relancer l'app.
  const value = useMemo(() => dependencies ?? createDependencies(), [dependencies]);
  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): Dependencies {
  const value = useContext(DependenciesContext);
  if (!value) throw new Error('useDependencies doit être utilisé dans <DependenciesProvider>');
  return value;
}
