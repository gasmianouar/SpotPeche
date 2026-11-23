import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import type { CatalogKind } from '../../domain/entities/Catalog';
import type { RecognitionResult } from '../../domain/usecases/RecognizeFromPhoto';

/** États successifs de l'écran (union discriminée, comme pour la météo). */
export type RecognitionUiState =
  | { status: 'noPhoto' }
  | { status: 'analyzing'; photoUri: string }
  | { status: 'done'; photoUri: string; results: RecognitionResult[] }
  | { status: 'error'; photoUri: string | null; message: string };

/**
 * VIEWMODEL de la reconnaissance par photo (espèce ou appât).
 * @param onAccept ce que fait « Ajouter » : cocher dans le brouillon (création)
 *                 ou dans les ajouts au spot (fiche). Le ViewModel n'a pas à le savoir.
 */
export function useRecognitionViewModel(kind: CatalogKind, onAccept: (itemId: string) => void) {
  const router = useRouter();
  const { photoService, recognizeFromPhoto } = useDependencies();
  const [uiState, setUiState] = useState<RecognitionUiState>({ status: 'noPhoto' });

  const analyze = useCallback(
    async (photoUri: string) => {
      setUiState({ status: 'analyzing', photoUri });
      try {
        const results = await recognizeFromPhoto.execute(kind, photoUri);
        setUiState(
          results.length > 0
            ? { status: 'done', photoUri, results }
            : { status: 'error', photoUri, message: "L'agent IA n'a rien reconnu. Essayez une photo plus nette." },
        );
      } catch {
        setUiState({ status: 'error', photoUri, message: "L'analyse a échoué. Vérifiez votre connexion et réessayez." });
      }
    },
    [kind, recognizeFromPhoto],
  );

  const takePhoto = useCallback(async () => {
    const uri = await photoService.takePhoto();
    if (uri) await analyze(uri);
  }, [photoService, analyze]);

  const pickPhoto = useCallback(async () => {
    const [uri] = await photoService.pickFromLibrary(1);
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
