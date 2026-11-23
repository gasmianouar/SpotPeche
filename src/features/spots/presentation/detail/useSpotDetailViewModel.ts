import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import type { NavigationApp, ShareTarget } from '@/core/external/ExternalApps';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import type { CatalogKind } from '../../domain/entities/Catalog';
import type { FishActivity } from '../../domain/entities/Spot';
import { quoteOf, type MessageQuote, type ReactionEmoji } from '../../domain/entities/SpotMessage';
import { openStreetMapUrl, spotShareText } from '../../domain/services/spotLinks';
import { SpotNotFoundError, type MessageView, type SpotDetail } from '../../domain/usecases/GetSpotDetail';
import { MESSAGE_MAX_PHOTOS, MessageValidationError } from '../../domain/usecases/PostMessage';

/** États de l'écran (union discriminée). */
export type SpotDetailUiState =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'error'; message: string }
  | { status: 'ready'; detail: SpotDetail };

/** VIEWMODEL de la fiche spot. */
export function useSpotDetailViewModel(spotId: string) {
  const router = useRouter();
  const deps = useDependencies();
  const { getSpotDetail, postMessage, reactToMessage, voteActivity, photoService, directionsService, shareService } = deps;
  const user = useSessionStore((s) => s.user);
  const userId = user?.id ?? '';

  const [uiState, setUiState] = useState<SpotDetailUiState>({ status: 'loading' });
  // Barre d'emoji ouverte sous ce message (une seule à la fois, comme sur Messenger).
  const [reactionsOpenFor, setReactionsOpenFor] = useState<string | null>(null);

  // Zone de saisie
  const [text, setText] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<MessageQuote | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  /** Augmente à chaque envoi : la vue s'en sert pour défiler jusqu'au dernier message. */
  const [sentCount, setSentCount] = useState(0);
  // Feuille « Itinéraire vers le spot » (Google Maps ou Waze)
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [directionsNotice, setDirectionsNotice] = useState<string | null>(null);
  // Feuille « Partager la localisation »
  const [shareOpen, setShareOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const detail = await getSpotDetail.execute(spotId, userId);
      setUiState({ status: 'ready', detail });
    } catch (error) {
      setUiState(
        error instanceof SpotNotFoundError
          ? { status: 'notFound' }
          : { status: 'error', message: 'Impossible d’ouvrir ce spot. Réessayez.' },
      );
    }
  }, [getSpotDetail, spotId, userId]);

  // Rechargé à chaque retour sur l'écran (ex. après avoir ajouté des espèces).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const detail = uiState.status === 'ready' ? uiState.detail : null;
  const spot = detail?.spot;

  // Itinéraire : on choisit Google Maps ou Waze, puis trajet complet depuis la position actuelle.
  const openDirections = useCallback(() => {
    setDirectionsNotice(null);
    setDirectionsOpen(true);
  }, []);
  const closeDirections = useCallback(() => setDirectionsOpen(false), []);

  const navigateWith = useCallback(
    async (app: NavigationApp) => {
      if (!spot) return;
      try {
        await directionsService.openDirections(spot.coordinates, app);
        setDirectionsOpen(false);
      } catch {
        setDirectionsNotice('Impossible d’ouvrir l’itinéraire. Vérifiez qu’un navigateur ou l’app est installé.');
      }
    },
    [directionsService, spot],
  );

  const openShare = useCallback(() => {
    setShareNotice(null);
    setShareOpen(true);
  }, []);
  const closeShare = useCallback(() => setShareOpen(false), []);

  const shareTo = useCallback(
    async (target: ShareTarget) => {
      if (!detail) return;
      const message = spotShareText(detail.spot, detail.species);
      try {
        const outcome = await shareService.shareTo(target, message, openStreetMapUrl(detail.spot.coordinates));
        if (outcome === 'fallback') {
          // L'app n'est pas installée : une autre solution s'est ouverte, on le dit.
          setShareNotice(
            target === 'whatsapp'
              ? 'WhatsApp n’est pas installé : ouverture de WhatsApp Web.'
              : 'Messenger n’est pas installé : choisissez une autre app.',
          );
        } else {
          setShareOpen(false);
        }
      } catch {
        setShareNotice('Impossible de partager pour le moment. Réessayez.');
      }
    },
    [shareService, detail],
  );

  const openWeather = useCallback(() => {
    if (!spot) return;
    router.push({ pathname: '/spot/[id]/meteo', params: { id: spot.id } });
  }, [router, spot]);

  const addItems = useCallback(
    (kind: CatalogKind) =>
      router.push({ pathname: '/spot/[id]/ajouter', params: { id: spotId, type: kind === 'species' ? 'especes' : 'appats' } }),
    [router, spotId],
  );

  const toggleReactions = useCallback(
    (messageId: string) => setReactionsOpenFor((current) => (current === messageId ? null : messageId)),
    [],
  );

  const react = useCallback(
    async (messageId: string, emoji: ReactionEmoji) => {
      setReactionsOpenFor(null);
      await reactToMessage.execute(messageId, userId, emoji);
      await load();
    },
    [reactToMessage, userId, load],
  );

  /** Pastilles « ça mord ? » : donner, changer ou retirer son avis. */
  const vote = useCallback(
    async (activity: FishActivity) => {
      await voteActivity.execute(spotId, userId, activity);
      await load();
    },
    [voteActivity, spotId, userId, load],
  );

  const reply = useCallback((view: MessageView) => {
    setReactionsOpenFor(null);
    setReplyTo(quoteOf(view.message));
  }, []);

  const takePhoto = useCallback(async () => {
    if (photoUris.length >= MESSAGE_MAX_PHOTOS) return;
    const uri = await photoService.takePhoto();
    if (uri) setPhotoUris((current) => [...current, uri].slice(0, MESSAGE_MAX_PHOTOS));
  }, [photoService, photoUris.length]);

  const pickPhotos = useCallback(async () => {
    const remaining = MESSAGE_MAX_PHOTOS - photoUris.length;
    if (remaining <= 0) return;
    const uris = await photoService.pickFromLibrary(remaining);
    setPhotoUris((current) => [...current, ...uris].slice(0, MESSAGE_MAX_PHOTOS));
  }, [photoService, photoUris.length]);

  const send = useCallback(async () => {
    setIsSending(true);
    setSendError(null);
    try {
      await postMessage.execute({
        spotId,
        author: { id: userId, name: user?.displayName ?? '', photoUrl: user?.photoUrl ?? null },
        text,
        photoUris,
        replyTo,
      });
      setText('');
      setPhotoUris([]);
      setReplyTo(null);
      await load();
      setSentCount((n) => n + 1);
    } catch (error) {
      setSendError(error instanceof MessageValidationError ? error.message : 'Envoi impossible. Réessayez.');
    } finally {
      setIsSending(false);
    }
  }, [postMessage, spotId, userId, user, text, photoUris, replyTo, load]);

  const composer = useMemo(
    () => ({
      text,
      photoUris,
      replyTo,
      isSending,
      error: sendError,
      canSend: !isSending && (text.trim().length > 0 || photoUris.length > 0),
      canAddPhotos: photoUris.length < MESSAGE_MAX_PHOTOS,
    }),
    [text, photoUris, replyTo, isSending, sendError],
  );

  return {
    uiState,
    reactionsOpenFor,
    composer,
    sentCount,
    retry: load,
    back: () => router.back(),
    openDirections,
    directionsOpen,
    directionsNotice,
    closeDirections,
    navigateWith,
    shareOpen,
    shareNotice,
    openShare,
    closeShare,
    shareTo,
    shareLink: spot ? openStreetMapUrl(spot.coordinates) : '',
    openWeather,
    addItems,
    toggleReactions,
    react,
    vote,
    reply,
    cancelReply: () => setReplyTo(null),
    setText,
    takePhoto,
    pickPhotos,
    removePhoto: (uri: string) => setPhotoUris((current) => current.filter((u) => u !== uri)),
    send,
  };
}
