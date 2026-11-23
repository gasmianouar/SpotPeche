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

/** Ce que Cloudflare fournit au serveur (réglages et secrets de wrangler.toml). */
interface Env {
  /** Secret : npx wrangler secret put ANTHROPIC_API_KEY */
  ANTHROPIC_API_KEY: string;
  MODEL?: string;
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
 *   POST /forecast  → analyse de l'activité des poissons d'un spot
 * La clé de l'API Claude reste ici, côté serveur : l'application ne la voit jamais.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/forecast') return json(404, { error: 'Introuvable' });
    if (request.method !== 'POST') return json(405, { error: 'Méthode non autorisée' });
    // Filtre simple contre les appels « au hasard » (ce n'est pas une authentification).
    if (request.headers.get('x-spot-client') !== 'spot-app/1') return json(403, { error: 'Client inconnu' });
    if (!env.ANTHROPIC_API_KEY) return json(500, { error: 'Serveur mal configuré : clé API absente' });

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
