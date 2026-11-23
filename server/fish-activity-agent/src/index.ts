import {
  ANTHROPIC_URL,
  ANTHROPIC_VERSION,
  BadModelOutputError,
  BadRequestError,
  buildAnthropicBody,
  cacheKeyFor,
  DEFAULT_MODEL,
  extractForecast,
  MAX_BODY_BYTES,
  parseClientRequest,
} from './agent';
import {
  buildRecognizeBody,
  extractRecognition,
  MAX_RECOGNIZE_BYTES,
  parseRecognizeRequest,
} from './recognize';

/** Ce que Cloudflare fournit au serveur (réglages et secrets de wrangler.toml). */
interface Env {
  /** Secret : npx wrangler secret put ANTHROPIC_API_KEY */
  ANTHROPIC_API_KEY: string;
  MODEL?: string;
  /** Modèle pour la reconnaissance photo (par défaut : MODEL). */
  RECOGNITION_MODEL?: string;
}

const CACHE_SECONDS = 30 * 60;

const json = (status: number, body: unknown, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Serveur de l'agent IA de Spot.
 *   POST /forecast   → analyse de l'activité des poissons d'un spot
 *   POST /recognize  → reconnaissance de l'espèce d'un poisson sur une photo
 * La clé de l'API Claude reste ici, côté serveur : l'application ne la voit jamais.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/forecast' && url.pathname !== '/recognize') return json(404, { error: 'Introuvable' });
    if (request.method !== 'POST') return json(405, { error: 'Méthode non autorisée' });
    // Filtre simple contre les appels « au hasard » (ce n'est pas une authentification).
    if (request.headers.get('x-spot-client') !== 'spot-app/1') return json(403, { error: 'Client inconnu' });
    if (!env.ANTHROPIC_API_KEY) return json(500, { error: 'Serveur mal configuré : clé API absente' });
    if (url.pathname === '/recognize') return recognize(request, env, ctx);

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'Requête trop grosse' });

    let input;
    try {
      input = parseClientRequest(JSON.parse(raw));
    } catch (error) {
      return json(400, { error: error instanceof BadRequestError ? error.message : 'JSON invalide' });
    }

    const model = env.MODEL || DEFAULT_MODEL;
    // Cache partagé : même spot, même heure, mêmes avis → même réponse, sans rappeler Claude.
    const cacheUrl = `https://cache.spot.internal/forecast/${await sha256(cacheKeyFor(input, model))}`;
    const cached = await caches.default.match(cacheUrl);
    if (cached) return cached;

    const apiResponse = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(buildAnthropicBody(input, model)),
    });
    if (!apiResponse.ok) {
      return json(502, { error: `L'API Claude a répondu ${apiResponse.status}` });
    }

    try {
      const forecast = extractForecast(await apiResponse.json(), input);
      const response = json(200, forecast, { 'cache-control': `public, max-age=${CACHE_SECONDS}` });
      ctx.waitUntil(caches.default.put(cacheUrl, response.clone()));
      return response;
    } catch (error) {
      return json(502, { error: error instanceof BadModelOutputError ? error.message : 'Réponse illisible' });
    }
  },
};

/** Appelle l'API Claude avec la clé du serveur. */
function callClaude(env: Env, body: unknown): Promise<Response> {
  return fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });
}

/** POST /recognize : quelle espèce de poisson sur la photo ? */
async function recognize(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_RECOGNIZE_BYTES) return json(413, { error: 'Photo trop lourde' });
  const raw = await request.text();
  if (raw.length > MAX_RECOGNIZE_BYTES) return json(413, { error: 'Photo trop lourde' });

  let input;
  try {
    input = parseRecognizeRequest(JSON.parse(raw));
  } catch (error) {
    return json(400, { error: error instanceof BadRequestError ? error.message : 'JSON invalide' });
  }

  const model = env.RECOGNITION_MODEL || env.MODEL || DEFAULT_MODEL;
  // Même photo envoyée deux fois (nouvel essai, réseau coupé…) → pas de deuxième facture.
  const key = await sha256(JSON.stringify([model, input.catalog.map((c) => c.id), input.data]));
  const cacheUrl = `https://cache.spot.internal/recognize/${key}`;
  const cached = await caches.default.match(cacheUrl);
  if (cached) return cached;

  const apiResponse = await callClaude(env, buildRecognizeBody(input, model));
  if (!apiResponse.ok) return json(502, { error: `L'API Claude a répondu ${apiResponse.status}` });

  try {
    const result = extractRecognition(await apiResponse.json(), input);
    const response = json(200, result, { 'cache-control': 'public, max-age=86400' });
    ctx.waitUntil(caches.default.put(cacheUrl, response.clone()));
    return response;
  } catch (error) {
    return json(502, { error: error instanceof BadModelOutputError ? error.message : 'Réponse illisible' });
  }
}
