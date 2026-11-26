import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import { UNSURE_NOTE } from '../../domain/recognition/scoreSpecies';
import type { RecognitionResult } from '../../domain/usecases/RecognizeFromPhoto';

/** La photo reste sur le téléphone : une bonne qualité aide le modèle (elle est réduite à 640 px avant l'analyse). */
const RECOGNITION_PHOTO = { quality: 0.8 };

export const UNAVAILABLE_MESSAGE = 'Reconnaissance indisponible sur ce téléphone. Choisissez l’espèce dans la liste.';

/** États successifs de l'écran (union discriminée, comme pour la météo). */
export type RecognitionUiState =
  | { status: 'noPhoto' }
  | { status: 'analyzing'; photoUri: string }
  | { status: 'done'; photoUri: string; results: RecognitionResult[]; note: string | null; isDemo: boolean }
  | { status: 'error'; photoUri: string | null; message: string; unavailable?: boolean };

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
                // « Je ne sais pas » : poisson absent du catalogue, photo floue…
                message: note ?? UNSURE_NOTE,
              },
        );
      } catch {
        // Sur le téléphone, une erreur veut dire que le modèle n'a pas pu tourner (mémoire, fichier abîmé) :
        // la liste reste toujours disponible.
        setUiState({ status: 'error', photoUri, message: UNAVAILABLE_MESSAGE, unavailable: true });
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
