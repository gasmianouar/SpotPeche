import { ExpoLocationService, type LocationService } from '@/core/location/LocationService';
import { FakeAuthRepository } from '@/features/auth/data/FakeAuthRepository';
import { SignInWithProvider } from '@/features/auth/domain/usecases/SignInWithProvider';
import { InMemorySpotRepository } from '@/features/spots/data/InMemorySpotRepository';
import { GetMapSpots } from '@/features/spots/domain/usecases/GetMapSpots';

/**
 * COMPOSITION ROOT : le seul endroit qui sait quelles implémentations concrètes
 * sont utilisées. Les écrans ne voient que les cas d'usage.
 *
 * Pour passer à la vraie connexion Facebook/Apple ou à un vrai backend,
 * on remplacera FakeAuthRepository / InMemorySpotRepository ici, et nulle part ailleurs.
 */
export interface Dependencies {
  signInWithProvider: SignInWithProvider;
  getMapSpots: GetMapSpots;
  locationService: LocationService;
}

export function createDependencies(): Dependencies {
  const authRepository = new FakeAuthRepository();
  const spotRepository = new InMemorySpotRepository();

  return {
    signInWithProvider: new SignInWithProvider(authRepository),
    getMapSpots: new GetMapSpots(spotRepository),
    locationService: new ExpoLocationService(),
  };
}
