import type { PhotoReader } from '@/core/media/PhotoReader';

import { SPECIES_CATALOG } from '../../domain/entities/Catalog';
import {
  PhotoTooLargeError,
  RecognitionUnavailableError,
  type ImageRecognizer,
  type RecognitionCandidate,
  type RecognitionOutcome,
} from '../../domain/recognition/ImageRecognizer';

/** Limite de l'API Claude pour une image : 5 Mo (une fois décodée). */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 45_000;
const FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Le VRAI agent de reconnaissance : la photo part vers notre serveur (route /recognize),
 * qui la fait analyser par Claude avec la clé d'API, gardée côté serveur.
 *
 * On envoie aussi le catalogue des espèces : l'agent ne peut répondre qu'avec ces identifiants.
 */
export class AgentImageRecognizer implements ImageRecognizer {
  readonly isDemo = false;

  constructor(
    private readonly baseUrl: string,
    private readonly photoReader: PhotoReader,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly timeoutMs = TIMEOUT_MS,
  ) {}

  async recognize(photoUri: string): Promise<RecognitionOutcome> {
    const photo = await this.photoReader.read(photoUri);
    if ((photo.data.length * 3) / 4 > MAX_PHOTO_BYTES) throw new PhotoTooLargeError();
    const mediaType = FORMATS.includes(photo.mediaType) ? photo.mediaType : 'image/jpeg';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl.replace(/\/$/, '')}/recognize`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-spot-client': 'spot-app/1' },
        body: JSON.stringify({ mediaType, data: photo.data, catalog: SPECIES_CATALOG }),
        signal: controller.signal,
      });
    } catch {
      throw new RecognitionUnavailableError('pas de réponse du serveur');
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 413) throw new PhotoTooLargeError();
    if (!response.ok) throw new RecognitionUnavailableError(`erreur ${response.status}`);
    return parseAgentReply(await response.json());
  }
}

/** Revérifie la réponse du serveur (on ne fait jamais confiance aveuglément au réseau). */
export function parseAgentReply(raw: unknown): RecognitionOutcome {
  const r = raw as { recognized?: unknown; candidates?: unknown; note?: unknown };
  const note = typeof r?.note === 'string' ? r.note.slice(0, 120) : undefined;
  if (r?.recognized !== true || !Array.isArray(r.candidates)) return { candidates: [], note };

  const candidates: RecognitionCandidate[] = r.candidates
    .filter((c): c is RecognitionCandidate => typeof c?.id === 'string' && typeof c?.confidence === 'number' && isFinite(c.confidence))
    .map((c) => ({ id: c.id, confidence: c.confidence }));
  return { candidates, note };
}
