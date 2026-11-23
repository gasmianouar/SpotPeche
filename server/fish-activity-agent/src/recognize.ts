/**
 * Agent de RECONNAISSANCE : quelle espèce de poisson sur une photo ?
 * (La reconnaissance des appâts a été retirée : l'app les fait choisir dans une liste.)
 *
 * Fiabilité :
 * - Claude ne peut répondre qu'avec un identifiant du catalogue envoyé par l'app
 *   (liste « enum » imposée par le schéma JSON) : il ne peut pas inventer d'espèce ;
 * - s'il n'est pas sûr, il le dit (recognized = false) au lieu de deviner ;
 * - tout est revérifié ici, puis encore dans l'app.
 */
import { BadModelOutputError, BadRequestError } from './agent';

/** Taille maximale de la requête : une photo de 5 Mo pèse ~7 Mo une fois encodée en base64. */
export const MAX_RECOGNIZE_BYTES = 7_500_000;
/** Limite de l'API Claude pour une image : 5 Mo (une fois décodée). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const ID = /^[a-z0-9-]{1,40}$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export interface CatalogEntry {
  id: string;
  name: string;
  latinName?: string;
}

export interface RecognizeRequest {
  mediaType: (typeof MEDIA_TYPES)[number];
  /** La photo, encodée en base64 (sans le préfixe « data: »). */
  data: string;
  catalog: CatalogEntry[];
}

const text = (value: unknown, max: number, field: string): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) throw new BadRequestError(`${field} invalide`);
  return value;
};

/** Vérifie la requête de l'app : on n'envoie jamais à Claude des données non contrôlées. */
export function parseRecognizeRequest(body: unknown): RecognizeRequest {
  const b = body as Record<string, unknown>;
  if (!MEDIA_TYPES.includes(b.mediaType as never)) throw new BadRequestError('Format de photo non accepté');
  const data = text(b.data, MAX_RECOGNIZE_BYTES, 'photo');
  if (!BASE64.test(data)) throw new BadRequestError('Photo mal encodée');
  if ((data.length * 3) / 4 > MAX_IMAGE_BYTES) throw new BadRequestError('Photo trop lourde');

  if (!Array.isArray(b.catalog) || b.catalog.length === 0 || b.catalog.length > 40) {
    throw new BadRequestError('catalogue invalide');
  }
  const catalog = b.catalog.map((raw) => {
    const item = raw as Record<string, unknown>;
    const id = text(item?.id, 40, 'catalog.id');
    if (!ID.test(id)) throw new BadRequestError('catalog.id invalide');
    const entry: CatalogEntry = { id, name: text(item.name, 60, 'catalog.name') };
    if (item.latinName !== undefined) entry.latinName = text(item.latinName, 80, 'catalog.latinName');
    return entry;
  });
  if (new Set(catalog.map((c) => c.id)).size !== catalog.length) throw new BadRequestError('catalogue en double');

  return { mediaType: b.mediaType as RecognizeRequest['mediaType'], data, catalog };
}

/** Schéma imposé : les identifiants possibles sont EXACTEMENT ceux du catalogue. */
export function recognitionSchema(catalog: readonly CatalogEntry[]) {
  return {
    type: 'object',
    properties: {
      recognized: { type: 'boolean', description: 'true seulement si la photo montre clairement un élément du catalogue' },
      candidates: {
        type: 'array',
        description: '1 à 3 propositions, de la plus probable à la moins probable. Vide si recognized est false.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: catalog.map((c) => c.id) },
            confidence: { type: 'number', description: 'Probabilité entre 0 et 1' },
          },
          required: ['id', 'confidence'],
          additionalProperties: false,
        },
      },
      note: { type: 'string', description: 'Une phrase courte en français (120 caractères max) : indices vus, ou pourquoi ce n’est pas reconnu' },
    },
    required: ['recognized', 'candidates', 'note'],
    additionalProperties: false,
  };
}

const PROMPT = `Tu es un ichtyologue spécialiste des poissons d'eau douce d'Europe, au service de Spot, une application de pêche de loisir.
On te montre la photo d'un poisson pris par un pêcheur. Identifie l'espèce parmi le catalogue fourni, et uniquement parmi lui.
Appuie-toi sur des critères anatomiques : forme du corps et de la tête, position et nombre des nageoires (dorsales séparées ou non), bouche et dents, barbillons, écailles, robe, motifs (barres, points, marbrures), couleur des nageoires.
Pièges fréquents : sandre et perche (deux dorsales épineuses ; barres verticales nettes et nageoires rouges pour la perche), brochet et sandre (bouche en bec de canard et dorsale très reculée pour le brochet), gardon et rotengle, carpe et carassin (barbillons chez la carpe), black-bass et perche.`;

const RULES = `
Règles de fiabilité, à respecter strictement :
- Ne réponds qu'avec des identifiants du catalogue. Si le poisson photographié n'y est pas, mets recognized à false et nomme-le dans la note.
- Si la photo est floue, trop sombre, trop lointaine, ou ne montre pas de poisson, mets recognized à false et candidates à [].
- Confiance calibrée : 0,9 et plus seulement si les critères distinctifs sont clairement visibles. La somme des confiances ne dépasse pas 1.
- Au plus 3 propositions, de la plus probable à la moins probable.
- La note est en français, 120 caractères maximum, sans formule de politesse.`;

export function buildRecognizeBody(request: RecognizeRequest, model: string) {
  return {
    model,
    max_tokens: 8_000,
    system: PROMPT + RULES,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: request.mediaType, data: request.data } },
          {
            type: 'text',
            text: `Catalogue (JSON) :\n${JSON.stringify(request.catalog)}\n\nQue montre cette photo ? Réponds au format demandé.`,
          },
        ],
      },
    ],
    output_config: { format: { type: 'json_schema', schema: recognitionSchema(request.catalog) } },
  };
}

export interface AgentRecognition {
  model: string;
  recognized: boolean;
  candidates: { id: string; confidence: number }[];
  note: string;
}

/** Lit et revérifie la réponse de Claude. */
export function extractRecognition(apiResponse: unknown, request: RecognizeRequest): AgentRecognition {
  const r = apiResponse as { model?: string; stop_reason?: string; content?: { type: string; text?: string }[] };
  if (r?.stop_reason && r.stop_reason !== 'end_turn') throw new BadModelOutputError(`Arrêt : ${r.stop_reason}`);
  const raw = r?.content?.find((block) => block.type === 'text')?.text;
  if (!raw) throw new BadModelOutputError('Pas de texte dans la réponse');

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BadModelOutputError('JSON illisible');
  }
  const known = new Set(request.catalog.map((c) => c.id));
  const seen = new Set<string>();
  const candidates = (Array.isArray(parsed.candidates) ? parsed.candidates : [])
    .filter((c: any) => typeof c?.id === 'string' && known.has(c.id) && typeof c.confidence === 'number')
    .filter((c: any) => !seen.has(c.id) && seen.add(c.id))
    .map((c: any) => ({ id: c.id as string, confidence: Math.min(1, Math.max(0, c.confidence)) }))
    .sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)
    .slice(0, 3);
  const recognized = parsed.recognized === true && candidates.length > 0;
  return {
    model: r.model ?? 'inconnu',
    recognized,
    candidates: recognized ? candidates : [],
    note: String(parsed.note ?? '').slice(0, 120),
  };
}
