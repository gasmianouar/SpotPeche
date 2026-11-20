import { createContext, useContext, useState, type ReactNode } from 'react';

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
  // useState(() => …) : créé une seule fois, au premier rendu.
  const [value] = useState(() => dependencies ?? createDependencies());
  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): Dependencies {
  const value = useContext(DependenciesContext);
  if (!value) throw new Error('useDependencies doit être utilisé dans <DependenciesProvider>');
  return value;
}
