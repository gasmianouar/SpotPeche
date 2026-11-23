import { createDatabaseProvider } from '@/core/database/openDatabase';
import { NativeExternalApps, type DirectionsService, type ShareService } from '@/core/external/ExternalApps';
import { RandomIdGenerator } from '@/core/ids/IdGenerator';
import {
  ExpoLocationService,
  type LocationService,
  type PreciseLocationService,
} from '@/core/location/LocationService';
import { ExpoPhotoService, type PhotoService } from '@/core/media/PhotoService';
import { FakeAuthRepository } from '@/features/auth/data/FakeAuthRepository';
import { SignInWithProvider } from '@/features/auth/domain/usecases/SignInWithProvider';
import { SignOut } from '@/features/auth/domain/usecases/SignOut';
import { SPOT_MIGRATIONS } from '@/features/spots/data/local/spotMigrations';
import { SqliteActivityVoteRepository } from '@/features/spots/data/local/SqliteActivityVoteRepository';
import { SqliteMessageRepository, SqliteReactionRepository } from '@/features/spots/data/local/SqliteMessageRepository';
import { SqliteSpotRepository } from '@/features/spots/data/local/SqliteSpotRepository';
import { DemoImageRecognizer } from '@/features/spots/data/recognition/DemoImageRecognizer';
import { AddSpotItems } from '@/features/spots/domain/usecases/AddSpotItems';
import { CreateSpot } from '@/features/spots/domain/usecases/CreateSpot';
import { GetMapSpots } from '@/features/spots/domain/usecases/GetMapSpots';
import { GetSpotDetail } from '@/features/spots/domain/usecases/GetSpotDetail';
import { PostMessage } from '@/features/spots/domain/usecases/PostMessage';
import { ReactToMessage } from '@/features/spots/domain/usecases/ReactToMessage';
import { VoteActivity } from '@/features/spots/domain/usecases/VoteActivity';
import { RecognizeFromPhoto } from '@/features/spots/domain/usecases/RecognizeFromPhoto';
import { OpenMeteoWeatherRepository } from '@/features/weather/data/OpenMeteoWeatherRepository';
import { GetLocalWeather } from '@/features/weather/domain/usecases/GetLocalWeather';

/**
 * COMPOSITION ROOT : le seul endroit qui sait quelles implémentations concrètes
 * sont utilisées. Les écrans ne voient que les cas d'usage et les interfaces.
 *
 * Pour brancher la vraie connexion Facebook/Apple ou le vrai agent IA,
 * on remplacera FakeAuthRepository / DemoImageRecognizer ici, et nulle part ailleurs.
 */
export interface Dependencies {
  signInWithProvider: SignInWithProvider;
  signOut: SignOut;
  getMapSpots: GetMapSpots;
  createSpot: CreateSpot;
  getSpotDetail: GetSpotDetail;
  addSpotItems: AddSpotItems;
  postMessage: PostMessage;
  reactToMessage: ReactToMessage;
  voteActivity: VoteActivity;
  recognizeFromPhoto: RecognizeFromPhoto;
  getLocalWeather: GetLocalWeather;
  locationService: LocationService;
  preciseLocationService: PreciseLocationService;
  photoService: PhotoService;
  directionsService: DirectionsService;
  shareService: ShareService;
}

export function createDependencies(): Dependencies {
  const authRepository = new FakeAuthRepository();
  // Base SQLite locale « spot.db » : les spots restent disponibles hors connexion.
  // Chaque feature apporte ses migrations ; on les réunit ici.
  const database = createDatabaseProvider('spot.db', [...SPOT_MIGRATIONS]);
  const spotRepository = new SqliteSpotRepository(database);
  const messageRepository = new SqliteMessageRepository(database);
  const reactionRepository = new SqliteReactionRepository(database);
  const voteRepository = new SqliteActivityVoteRepository(database);
  const idGenerator = new RandomIdGenerator();
  const externalApps = new NativeExternalApps();
  const weatherRepository = new OpenMeteoWeatherRepository();
  // Une seule instance joue trois rôles (position, position précise, nom de ville).
  const expoLocation = new ExpoLocationService();

  return {
    signInWithProvider: new SignInWithProvider(authRepository),
    signOut: new SignOut(authRepository),
    getMapSpots: new GetMapSpots(spotRepository),
    createSpot: new CreateSpot(spotRepository, voteRepository, idGenerator),
    getSpotDetail: new GetSpotDetail(spotRepository, messageRepository, reactionRepository, voteRepository),
    addSpotItems: new AddSpotItems(spotRepository),
    postMessage: new PostMessage(messageRepository, idGenerator),
    reactToMessage: new ReactToMessage(reactionRepository),
    voteActivity: new VoteActivity(voteRepository),
    recognizeFromPhoto: new RecognizeFromPhoto(new DemoImageRecognizer()),
    getLocalWeather: new GetLocalWeather(expoLocation, expoLocation, weatherRepository),
    locationService: expoLocation,
    preciseLocationService: expoLocation,
    photoService: new ExpoPhotoService(),
    directionsService: externalApps,
    shareService: externalApps,
  };
}
