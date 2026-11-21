import { ExpoLocationService, type LocationService } from '@/core/location/LocationService';
import { FakeAuthRepository } from '@/features/auth/data/FakeAuthRepository';
import { SignInWithProvider } from '@/features/auth/domain/usecases/SignInWithProvider';
import { SignOut } from '@/features/auth/domain/usecases/SignOut';
import { InMemorySpotRepository } from '@/features/spots/data/InMemorySpotRepository';
import { GetMapSpots } from '@/features/spots/domain/usecases/GetMapSpots';
import { OpenMeteoWeatherRepository } from '@/features/weather/data/OpenMeteoWeatherRepository';
import { GetLocalWeather } from '@/features/weather/domain/usecases/GetLocalWeather';

/**
 * COMPOSITION ROOT : le seul endroit qui sait quelles implémentations concrètes
 * sont utilisées. Les écrans ne voient que les cas d'usage.
 *
 * Pour passer à la vraie connexion Facebook/Apple ou à un vrai backend,
 * on remplacera FakeAuthRepository / InMemorySpotRepository ici, et nulle part ailleurs.
 */
export interface Dependencies {
  signInWithProvider: SignInWithProvider;
  signOut: SignOut;
  getMapSpots: GetMapSpots;
  getLocalWeather: GetLocalWeather;
  locationService: LocationService;
}

export function createDependencies(): Dependencies {
  const authRepository = new FakeAuthRepository();
  const spotRepository = new InMemorySpotRepository();
  const weatherRepository = new OpenMeteoWeatherRepository();
  // Une seule instance joue deux rôles (position + nom de ville).
  const expoLocation = new ExpoLocationService();

  return {
    signInWithProvider: new SignInWithProvider(authRepository),
    signOut: new SignOut(authRepository),
    getMapSpots: new GetMapSpots(spotRepository),
    getLocalWeather: new GetLocalWeather(expoLocation, expoLocation, weatherRepository),
    locationService: expoLocation,
  };
}
