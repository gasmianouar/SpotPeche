import { env } from '@/core/config/env';
import { createDatabaseProvider } from '@/core/database/openDatabase';
import { KvLanguageRepository } from '@/core/i18n/KvLanguageRepository';
import { LanguagePreference } from '@/core/i18n/LanguagePreference';
import { NativeExternalApps, type DirectionsService, type ShareService } from '@/core/external/ExternalApps';
import { RandomIdGenerator } from '@/core/ids/IdGenerator';
import {
  ExpoLocationService,
  type LocationService,
  type PreciseLocationService,
} from '@/core/location/LocationService';
import { ExpoPhotoService, type PhotoService } from '@/core/media/PhotoService';
import { ExpoPhotoPixelsReader } from '@/core/media/PhotoPixelsReader';
import { getSupabase, isSupabaseConfigured } from '@/core/supabase/supabaseClient';
import { FakeAccountRepository } from '@/features/account/data/FakeAccountRepository';
import { KvAccountPreferencesRepository } from '@/features/account/data/KvAccountPreferencesRepository';
import { SqliteAccountDataEraser } from '@/features/account/data/local/SqliteAccountDataEraser';
import {
  CompositeAccountDataEraser,
  SupabaseAccountDataEraser,
  SupabaseAccountRepository,
} from '@/features/account/data/remote/SupabaseAccountRepositories';
import type { AccountDataEraser } from '@/features/account/domain/ports/AccountDataEraser';
import type { AccountRepository } from '@/features/account/domain/repositories/AccountRepository';
import { GetAccountPreferences, UpdateAccountPreferences } from '@/features/account/domain/usecases/AccountPreferencesUseCases';
import { DeleteAccount } from '@/features/account/domain/usecases/DeleteAccount';
import { GetLinkedProviders, LinkProvider } from '@/features/account/domain/usecases/LinkedProviders';
import { FakeAuthRepository } from '@/features/auth/data/FakeAuthRepository';
import { SupabaseAuthRepository } from '@/features/auth/data/remote/SupabaseAuthRepository';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository';
import { RestoreSession } from '@/features/auth/domain/usecases/RestoreSession';
import { CachedFishActivityAdvisor } from '@/features/fishingForecast/data/CachedFishActivityAdvisor';
import { LocalFishActivityAdvisor } from '@/features/fishingForecast/data/LocalFishActivityAdvisor';
import { FindNearbyBaitShops } from '@/features/baitShops/domain/usecases/FindNearbyBaitShops';
import { GetMyCatches } from '@/features/catches/domain/usecases/GetMyCatches';
import { FORECAST_MIGRATIONS } from '@/features/fishingForecast/data/local/forecastMigrations';
import { QuotaLimitedFishActivityAdvisor } from '@/features/fishingForecast/data/QuotaLimitedFishActivityAdvisor';
import { SqliteUsageRepository } from '@/features/freeQuota/data/local/SqliteUsageRepository';
import { USAGE_MIGRATIONS } from '@/features/freeQuota/data/local/usageMigrations';
import { FreeQuota } from '@/features/freeQuota/domain/FreeQuota';
import { SqliteReliabilityRatingRepository } from '@/features/fishingForecast/data/local/SqliteReliabilityRatingRepository';
import { RemoteAiFishActivityAdvisor } from '@/features/fishingForecast/data/RemoteAiFishActivityAdvisor';
import { ResilientFishActivityAdvisor } from '@/features/fishingForecast/data/ResilientFishActivityAdvisor';
import type { FishActivityAdvisor } from '@/features/fishingForecast/domain/ports/FishActivityAdvisor';
import { GetSpotFishingConditions } from '@/features/fishingForecast/domain/usecases/GetSpotFishingConditions';
import { RateForecastReliability } from '@/features/fishingForecast/domain/usecases/RateForecastReliability';
import { SignInWithProvider } from '@/features/auth/domain/usecases/SignInWithProvider';
import { SignOut } from '@/features/auth/domain/usecases/SignOut';
import { MODERATION_MIGRATIONS } from '@/features/moderation/data/local/moderationMigrations';
import { SqliteBlockRepository, SqliteReportRepository } from '@/features/moderation/data/local/SqliteModerationRepositories';
import { SupabaseBlockRepository, SupabaseReportRepository } from '@/features/moderation/data/remote/SupabaseModerationRepositories';
import type { BlockRepository } from '@/features/moderation/domain/repositories/BlockRepository';
import type { ReportRepository } from '@/features/moderation/domain/repositories/ReportRepository';
import { BlockUser, GetBlockedUsers, UnblockUser } from '@/features/moderation/domain/usecases/BlockUser';
import { ReportContent } from '@/features/moderation/domain/usecases/ReportContent';
import { SPOT_MIGRATIONS } from '@/features/spots/data/local/spotMigrations';
import { SqliteActivityVoteRepository } from '@/features/spots/data/local/SqliteActivityVoteRepository';
import { SqliteMessageRepository, SqliteReactionRepository } from '@/features/spots/data/local/SqliteMessageRepository';
import { SqliteSpotRepository } from '@/features/spots/data/local/SqliteSpotRepository';
import {
  SupabaseActivityVoteRepository,
  SupabaseMessageRepository,
  SupabaseReactionRepository,
} from '@/features/spots/data/remote/SupabaseMessageRepositories';
import { SupabaseSpotRepository } from '@/features/spots/data/remote/SupabaseSpotRepository';
import type { ActivityVoteRepository } from '@/features/spots/domain/repositories/ActivityVoteRepository';
import type { MessageRepository } from '@/features/spots/domain/repositories/MessageRepository';
import type { ReactionRepository } from '@/features/spots/domain/repositories/ReactionRepository';
import type { SpotRepository } from '@/features/spots/domain/repositories/SpotRepository';
import { ExecutorchFishDetector } from '@/features/spots/data/recognition/executorch/ExecutorchFishDetector';
import { ExecutorchSpeciesEmbedder } from '@/features/spots/data/recognition/executorch/ExecutorchSpeciesEmbedder';
import { MODEL_ASSETS, SPECIES_HEAD } from '@/features/spots/data/recognition/executorch/modelAssets';
import { ExecutorchPteRunner } from '@/features/spots/data/recognition/executorch/PteRunner';
import { loadSpeciesHead } from '@/features/spots/data/recognition/executorch/speciesHead';
import { OnDeviceImageRecognizer } from '@/features/spots/data/recognition/OnDeviceImageRecognizer';
import { SPECIES_CATALOG } from '@/features/spots/domain/entities/Catalog';
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
 * Deux modes, choisis par le fichier .env :
 * - SERVEUR (EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY remplis) : vraie connexion
 *   Facebook/Apple/Google, spots, discussions, blocages et signalements partagés via Supabase ;
 * - LOCAL (rien de rempli) : tout reste sur le téléphone, connexion simulée (développement, démo).
 */
export interface Dependencies {
  languagePreference: LanguagePreference;
  findNearbyBaitShops: FindNearbyBaitShops;
  getMyCatches: GetMyCatches;
  signInWithProvider: SignInWithProvider;
  signOut: SignOut;
  restoreSession: RestoreSession;
  getMapSpots: GetMapSpots;
  createSpot: CreateSpot;
  getSpotDetail: GetSpotDetail;
  addSpotItems: AddSpotItems;
  postMessage: PostMessage;
  reactToMessage: ReactToMessage;
  voteActivity: VoteActivity;
  recognizeFromPhoto: RecognizeFromPhoto;
  getLocalWeather: GetLocalWeather;
  getSpotFishingConditions: GetSpotFishingConditions;
  rateForecastReliability: RateForecastReliability;
  locationService: LocationService;
  preciseLocationService: PreciseLocationService;
  photoService: PhotoService;
  directionsService: DirectionsService;
  shareService: ShareService;
  // Signalement et blocage (Sprint 10)
  reportContent: ReportContent;
  blockUser: BlockUser;
  unblockUser: UnblockUser;
  getBlockedUsers: GetBlockedUsers;
  // Compte et confidentialité (Sprint 10)
  getAccountPreferences: GetAccountPreferences;
  updateAccountPreferences: UpdateAccountPreferences;
  getLinkedProviders: GetLinkedProviders;
  linkProvider: LinkProvider;
  deleteAccount: DeleteAccount;
}

export function createDependencies(): Dependencies {
  // Base SQLite locale « spot.db » : les spots restent disponibles hors connexion.
  // Chaque feature apporte ses migrations ; on les réunit ici.
  const database = createDatabaseProvider('spot.db', [
    ...SPOT_MIGRATIONS,
    ...FORECAST_MIGRATIONS,
    ...USAGE_MIGRATIONS,
    ...MODERATION_MIGRATIONS,
  ]);
  const idGenerator = new RandomIdGenerator();
  const externalApps = new NativeExternalApps();
  const accountPreferences = new KvAccountPreferencesRepository();
  const localEraser = new SqliteAccountDataEraser(database);

  // Données partagées : sur le serveur Supabase s'il est configuré, sinon dans la base du téléphone.
  let authRepository: AuthRepository;
  let spotRepository: SpotRepository;
  let messageRepository: MessageRepository;
  let reactionRepository: ReactionRepository;
  let voteRepository: ActivityVoteRepository;
  let blockRepository: BlockRepository;
  let reportRepository: ReportRepository;
  let accountRepository: AccountRepository;
  let accountDataEraser: AccountDataEraser;
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    authRepository = new SupabaseAuthRepository(supabase);
    spotRepository = new SupabaseSpotRepository(supabase);
    messageRepository = new SupabaseMessageRepository(supabase);
    reactionRepository = new SupabaseReactionRepository(supabase);
    voteRepository = new SupabaseActivityVoteRepository(supabase);
    // Blocages et signalements sur le serveur : ils valent sur tous les téléphones et arrivent à la modération.
    blockRepository = new SupabaseBlockRepository(supabase);
    reportRepository = new SupabaseReportRepository(supabase);
    accountRepository = new SupabaseAccountRepository(supabase);
    // Suppression du compte : le serveur d'abord (fonction delete-account), puis ce qui reste sur le téléphone.
    accountDataEraser = new CompositeAccountDataEraser([new SupabaseAccountDataEraser(supabase), localEraser]);
  } else {
    authRepository = new FakeAuthRepository();
    spotRepository = new SqliteSpotRepository(database);
    messageRepository = new SqliteMessageRepository(database);
    reactionRepository = new SqliteReactionRepository(database);
    voteRepository = new SqliteActivityVoteRepository(database);
    blockRepository = new SqliteBlockRepository(database);
    reportRepository = new SqliteReportRepository(database);
    // Compte côté serveur SIMULÉ, comme la connexion.
    accountRepository = new FakeAccountRepository();
    accountDataEraser = localEraser;
  }

  // L'app est gratuite : l'analyse IA de l'activité des poissons (payante pour nous) a une limite par jour et par téléphone.
  const freeQuota = new FreeQuota(new SqliteUsageRepository(database));

  // Activité des poissons : l'agent IA (serveur Claude) si son adresse est configurée,
  // dans la limite gratuite du jour, avec repli automatique sur l'algorithme local et un cache de 30 min.
  // Sans adresse : l'algorithme local seul, gratuit. (Décorateurs empilés : le O et le D de SOLID.)
  const localAdvisor = new LocalFishActivityAdvisor();
  const fishActivityAdvisor: FishActivityAdvisor = env.spotAiUrl
    ? new CachedFishActivityAdvisor(
        new QuotaLimitedFishActivityAdvisor(
          new ResilientFishActivityAdvisor(new RemoteAiFishActivityAdvisor(env.spotAiUrl), localAdvisor),
          localAdvisor,
          freeQuota,
        ),
      )
    : localAdvisor;
  const ratingRepository = new SqliteReliabilityRatingRepository(database);
  const weatherRepository = new OpenMeteoWeatherRepository();
  // Une seule instance joue trois rôles (position, position précise, nom de ville).
  const expoLocation = new ExpoLocationService();

  return {
    // Langue de l'app (arabe, français, anglais), gardée sur le téléphone.
    languagePreference: new LanguagePreference(new KvLanguageRepository()),
    // Menu : boutiques d'appâts (Google Maps) et « Mes prises » (mes photos publiées).
    findNearbyBaitShops: new FindNearbyBaitShops(externalApps),
    getMyCatches: new GetMyCatches(spotRepository, messageRepository),
    signInWithProvider: new SignInWithProvider(authRepository),
    signOut: new SignOut(authRepository),
    restoreSession: new RestoreSession(authRepository),
    getMapSpots: new GetMapSpots(spotRepository, blockRepository),
    createSpot: new CreateSpot(spotRepository, voteRepository, idGenerator),
    getSpotDetail: new GetSpotDetail(spotRepository, messageRepository, reactionRepository, voteRepository, blockRepository),
    addSpotItems: new AddSpotItems(spotRepository),
    postMessage: new PostMessage(messageRepository, idGenerator),
    reactToMessage: new ReactToMessage(reactionRepository),
    voteActivity: new VoteActivity(voteRepository),
    // Reconnaissance de l'espèce SUR LE TÉLÉPHONE (Sprint 7) : gratuite, illimitée, sans réseau.
    // Détecteur et classifieur Fishial (ExecuTorch), puis couche de décision apprise sur nos photos de référence.
    // Elle est vérifiée au premier usage : un fichier abîmé ne fait pas planter l'app.
    // (AgentImageRecognizer et DemoImageRecognizer restent dans le projet, non branchés.)
    recognizeFromPhoto: new RecognizeFromPhoto(
      new OnDeviceImageRecognizer(
        new ExpoPhotoPixelsReader(),
        new ExecutorchFishDetector(new ExecutorchPteRunner(MODEL_ASSETS.detector)),
        new ExecutorchSpeciesEmbedder(new ExecutorchPteRunner(MODEL_ASSETS.embedder)),
        () => loadSpeciesHead(SPECIES_HEAD, SPECIES_CATALOG),
      ),
    ),
    getLocalWeather: new GetLocalWeather(expoLocation, expoLocation, weatherRepository),
    getSpotFishingConditions: new GetSpotFishingConditions(weatherRepository, fishActivityAdvisor, localAdvisor, ratingRepository),
    rateForecastReliability: new RateForecastReliability(ratingRepository),
    locationService: expoLocation,
    preciseLocationService: expoLocation,
    photoService: new ExpoPhotoService(),
    directionsService: externalApps,
    shareService: externalApps,
    // Signalements : envoyés à la modération (Supabase), ou gardés sur le téléphone en mode local.
    reportContent: new ReportContent(reportRepository, idGenerator),
    blockUser: new BlockUser(blockRepository),
    unblockUser: new UnblockUser(blockRepository),
    getBlockedUsers: new GetBlockedUsers(blockRepository),
    getAccountPreferences: new GetAccountPreferences(accountPreferences),
    updateAccountPreferences: new UpdateAccountPreferences(accountPreferences),
    getLinkedProviders: new GetLinkedProviders(accountRepository),
    linkProvider: new LinkProvider(accountRepository),
    deleteAccount: new DeleteAccount(accountRepository, accountDataEraser, accountPreferences),
  };
}
