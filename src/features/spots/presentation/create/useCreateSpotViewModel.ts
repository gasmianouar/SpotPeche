import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useI18n } from '@/core/i18n/useI18n';
import { LocationUnavailableError } from '@/core/location/LocationService';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';
import type { Coordinates } from '@/shared/domain/Coordinates';

import { findCatalogItems, type CatalogKind } from '../../domain/entities/Catalog';
import type { FishActivity } from '../../domain/entities/Spot';
import { DESCRIPTION_MAX_LENGTH, SpotValidationError } from '../../domain/usecases/CreateSpot';
import { MAX_PHOTOS, useSpotDraftStore } from './spotDraftStore';

export interface CreateSpotErrors {
  coordinates?: string;
  description?: string;
  general?: string;
}

/** VIEWMODEL de l'écran « Nouveau spot ». Le brouillon vit dans spotDraftStore. */
export function useCreateSpotViewModel() {
  const { t } = useI18n();
  const router = useRouter();
  const { createSpot, preciseLocationService, photoService } = useDependencies();
  const user = useSessionStore((s) => s.user);
  const draft = useSpotDraftStore();

  // La position est cherchée AUTOMATIQUEMENT à l'ouverture, sauf si le brouillon en a déjà une.
  const [isLocating, setIsLocating] = useState(() => useSpotDraftStore.getState().coordinates === null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<CreateSpotErrors>({});

  /** Coordonnées GPS exactes du téléphone, lues une seule fois à l'ouverture de l'écran. */
  const locateAutomatically = useCallback(async () => {
    try {
      const position = await preciseLocationService.getPrecisePosition();
      // Pendant la recherche, l'utilisateur a peut-être déjà placé le spot sur la carte :
      // son choix manuel gagne, on n'écrase pas.
      if (useSpotDraftStore.getState().positionSource === 'map') return;
      if (!position) {
        setErrors((e) => ({ ...e, coordinates: t('create.error.denied') }));
        return;
      }
      useSpotDraftStore.getState().setPosition(position.coordinates, 'gps', position.accuracyMeters);
    } catch (error) {
      if (useSpotDraftStore.getState().positionSource === 'map') return;
      const message =
        error instanceof LocationUnavailableError && error.reason === 'servicesDisabled'
          ? t('create.error.disabled')
          : t('create.error.noSignal');
      setErrors((e) => ({ ...e, coordinates: message }));
    } finally {
      setIsLocating(false);
    }
  }, [preciseLocationService, t]);

  // Au premier affichage uniquement (le retour depuis le choix des espèces ne relance rien).
  const started = useRef(false);
  useEffect(() => {
    if (started.current || useSpotDraftStore.getState().coordinates !== null) return;
    started.current = true;
    locateAutomatically();
  }, [locateAutomatically]);

  /** L'utilisateur a déplacé la carte à la main : le centre devient la position du spot. */
  const onMapMoved = useCallback(
    (coordinates: Coordinates) => {
      draft.setPosition(coordinates, 'map');
      setErrors((e) => ({ ...e, coordinates: undefined }));
    },
    [draft],
  );

  const openPicker = (kind: CatalogKind) =>
    router.push(kind === 'species' ? '/nouveau-spot/especes' : '/nouveau-spot/appats');

  /** Icône appareil photo de la barre d'outils : on prend une photo et on la joint au commentaire. */
  const takePhoto = useCallback(async () => {
    if (draft.photoUris.length >= MAX_PHOTOS) return;
    const uri = await photoService.takePhoto();
    if (uri) draft.addPhotos([uri]);
  }, [photoService, draft]);

  /** Icône galerie : on choisit une ou plusieurs photos existantes. */
  const pickPhotos = useCallback(async () => {
    const remaining = MAX_PHOTOS - draft.photoUris.length;
    if (remaining <= 0) return;
    const uris = await photoService.pickFromLibrary(remaining);
    draft.addPhotos(uris);
  }, [photoService, draft]);

  /** Les erreurs de validation du domaine, traduites (le domaine ne connaît que le champ et la règle). */
  const validationMessage = useCallback(
    (error: SpotValidationError) => {
      if (error.field === 'description') return t('create.error.tooLong', { max: DESCRIPTION_MAX_LENGTH });
      return error.message.startsWith('Position invalide') ? t('create.error.invalidPosition') : t('create.error.noCoordinates');
    },
    [t],
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    setErrors({});
    try {
      // Le créateur est repris du profil Facebook de la personne connectée.
      const owner = { id: user?.id ?? '', name: user?.displayName ?? '', photoUrl: user?.photoUrl ?? null };
      const spot = await createSpot.execute(draft, owner);
      draft.reset();
      // Retour à l'accueil avec l'info du spot créé : bandeau + carte centrée dessus.
      router.dismissTo({
        pathname: '/',
        params: {
          savedSpotId: spot.id,
          lat: String(spot.coordinates.latitude),
          lon: String(spot.coordinates.longitude),
        },
      });
    } catch (error) {
      if (error instanceof SpotValidationError) {
        setErrors({ [error.field]: validationMessage(error) });
      } else {
        setErrors({ general: t('create.error.save') });
      }
    } finally {
      setIsSaving(false);
    }
  }, [createSpot, draft, user, router, t, validationMessage]);

  /** Flèche retour : on abandonne le brouillon. */
  const cancel = useCallback(() => {
    draft.reset();
    router.back();
  }, [draft, router]);

  return {
    draft: {
      coordinates: draft.coordinates,
      positionSource: draft.positionSource,
      accuracyMeters: draft.accuracyMeters,
      species: findCatalogItems('species', draft.speciesIds),
      baits: findCatalogItems('bait', draft.baitIds),
      activity: draft.activity,
      description: draft.description,
      photoUris: draft.photoUris,
    },
    isLocating,
    isSaving,
    errors,
    canAddPhotos: draft.photoUris.length < MAX_PHOTOS,
    onMapMoved,
    openPicker,
    setActivity: (activity: FishActivity) => draft.setActivity(activity),
    setDescription: (text: string) => draft.setDescription(text),
    takePhoto,
    pickPhotos,
    removePhoto: (uri: string) => draft.removePhoto(uri),
    save,
    cancel,
  };
}
