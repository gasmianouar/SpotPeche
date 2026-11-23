import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { FreeLimitReachedError } from '@/features/freeQuota/domain/FreeQuota';

import { PhotoTooLargeError } from '../../domain/recognition/ImageRecognizer';
import type { RecognitionResult } from '../../domain/usecases/RecognizeFromPhoto';

/** Photo un peu compressée : l'envoi à l'agent est plus rapide, la reconnaissance reste bonne. */
const RECOGNITION_PHOTO = { quality: 0.5 };

/** États successifs de l'écran (union discriminée, comme pour la météo). */
export type RecognitionUiState =
  | { status: 'noPhoto' }
  | { status: 'analyzing'; photoUri: string }
  | { status: 'done'; photoUri: string; results: RecognitionResult[]; note: string | null; isDemo: boolean }
  | { status: 'error'; photoUri: string | null; message: string; limitReached?: boolean };

/**
 * VIEWMODEL de la reconnaissance de l'espèce par photo.
 * @param onAccept ce que fait « Ajouter » : cocher dans le brouillon (création)
 *                 ou dans les ajouts au spot (fiche). Le ViewModel n'a pas à le savoir.
 */
export function useRecognitionViewModel(onAccept: (itemId: string) => void) {
  const router = useRouter();
  const { photoService, recognizeFromPhoto } = useDependencies();
  const [uiState, setUiState] = useState<RecognitionUiState>({ status: 'noPhoto' });

  const analyze = useCallback(
    async (photoUri: string) => {
      setUiState({ status: 'analyzing', photoUri });
      try {
        const { results, note, isDemo } = await recognizeFromPhoto.execute(photoUri);
        setUiState(
          results.length > 0
            ? { status: 'done', photoUri, results, note, isDemo }
            : {
                status: 'error',
                photoUri,
                // L'agent explique pourquoi (photo floue, élément absent du catalogue…).
                message: note ?? "L'agent IA n'a rien reconnu. Essayez une photo plus nette.",
              },
        );
      } catch (error) {
        if (error instanceof FreeLimitReachedError) {
          setUiState({ status: 'error', photoUri, message: error.message, limitReached: true });
          return;
        }
        setUiState({
          status: 'error',
          photoUri,
          message:
            error instanceof PhotoTooLargeError
              ? 'Photo trop lourde. Reprenez-la ou choisissez-en une autre.'
              : 'Reconnaissance indisponible pour le moment. Vérifiez votre connexion, ou choisissez dans la liste.',
        });
      }
    },
    [recognizeFromPhoto],
  );

  const takePhoto = useCallback(async () => {
    const uri = await photoService.takePhoto(RECOGNITION_PHOTO);
    if (uri) await analyze(uri);
  }, [photoService, analyze]);

  const pickPhoto = useCallback(async () => {
    const [uri] = await photoService.pickFromLibrary(1, RECOGNITION_PHOTO);
    if (uri) await analyze(uri);
  }, [photoService, analyze]);

  // À l'ouverture de l'écran, on lance directement l'appareil photo (une seule fois).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    takePhoto();
  }, [takePhoto]);

  /** « Ajouter » : la proposition est cochée dans le brouillon, puis retour à la liste. */
  const accept = (result: RecognitionResult) => {
    onAccept(result.item.id);
    router.back();
  };

  return { uiState, takePhoto, pickPhoto, accept, close: () => router.back() };
}
