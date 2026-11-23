import {
  BadModelOutputError,
  BadRequestError,
  buildAnthropicBody,
  cacheKeyFor,
  DEFAULT_MODEL,
  extractForecast,
  OUTPUT_SCHEMA,
  parseClientRequest,
} from '../agent';

const validBody = () => ({
  latitude: 48.7812,
  longitude: 2.4455,
  hours: [
    { time: '2026-11-23T16:00', temperature: 9, pressure: 1014.2, wind: 12, sky: 'overcast' },
    { time: '2026-11-23T17:00', temperature: 8, pressure: 1013.8, wind: 10, sky: 'storm' },
  ],
  sun: [{ date: '2026-11-23', sunrise: '2026-11-23T08:10', sunset: '2026-11-23T17:00' }],
  moon: { name: 'Pleine lune', ageInDays: 14.5 },
  species: ['Sandre', 'Brochet'],
  community: { activityVotes: { good: 3, medium: 1, none: 0 }, reliability: { reliable: 2, soSo: 0, wrong: 1 } },
});

const apiReply = (payload: object, extra: object = {}) => ({
  model: 'claude-fable-5-2',
  stop_reason: 'end_turn',
  content: [
    { type: 'thinking', thinking: '…' },
    { type: 'text', text: JSON.stringify(payload) },
  ],
  ...extra,
});

describe('serveur de l’agent : requête', () => {
  it('accepte une requête valide', () => {
    expect(parseClientRequest(validBody()).hours).toHaveLength(2);
  });

  it('refuse les données invalides ou trop grosses', () => {
    expect(() => parseClientRequest({ ...validBody(), latitude: 120 })).toThrow(BadRequestError);
    expect(() => parseClientRequest({ ...validBody(), hours: [] })).toThrow(BadRequestError);
    expect(() => parseClientRequest({ ...validBody(), species: Array(30).fill('x') })).toThrow(BadRequestError);
    const badSky = validBody();
    (badSky.hours[0] as { sky: string }).sky = 'tempête de grenouilles';
    expect(() => parseClientRequest(badSky)).toThrow(BadRequestError);
  });
});

describe('serveur de l’agent : appel à Claude', () => {
  it('impose le modèle, la consigne et le schéma JSON de sortie', () => {
    const body = buildAnthropicBody(parseClientRequest(validBody()), DEFAULT_MODEL);

    expect(body.model).toBe('claude-fable-5-2');
    expect(body.system).toContain('halieute');
    expect(body.output_config).toEqual({ format: { type: 'json_schema', schema: OUTPUT_SCHEMA } });
    expect(body.messages[0].content).toContain('"species":["Sandre","Brochet"]');
  });

  it('lit le JSON du bloc texte et vérifie chaque heure', () => {
    const request = parseClientRequest(validBody());
    const forecast = extractForecast(
      apiReply({
        index_score: 4,
        summary: 'Crépuscule prometteur.',
        reasons: ['Pression en baisse', 'Orage vers 17h', 'Pleine lune', 'trop'],
        hourly: [
          { time: '2026-11-23T16:00', score: 82 },
          { time: '2026-11-23T17:00', score: 3 },
        ],
        best_window_start: '2026-11-23T16:00',
        best_window_end: '2026-11-23T17:00',
        confidence: 'high',
      }),
      request,
    );

    expect(forecast.model).toBe('claude-fable-5-2');
    expect(forecast.hourly).toEqual([
      { time: '2026-11-23T16:00', score: 82 },
      { time: '2026-11-23T17:00', score: 3 },
    ]);
    expect(forecast.reasons).toHaveLength(3);
  });

  it('refuse une réponse incomplète, coupée ou refusée', () => {
    const request = parseClientRequest(validBody());
    const partial = { index_score: 3, summary: '', reasons: [], hourly: [{ time: '2026-11-23T16:00', score: 50 }] };

    expect(() => extractForecast(apiReply(partial), request)).toThrow(BadModelOutputError);
    expect(() => extractForecast(apiReply(partial, { stop_reason: 'max_tokens' }), request)).toThrow(BadModelOutputError);
    expect(() => extractForecast({ content: [] }, request)).toThrow(BadModelOutputError);
  });

  it('même spot (à 100 m près) et mêmes conditions → même clé de cache', () => {
    const a = parseClientRequest(validBody());
    const b = parseClientRequest({ ...validBody(), latitude: 48.78121, species: ['Brochet', 'Sandre'] });
    const c = parseClientRequest({ ...validBody(), latitude: 48.79 });

    expect(cacheKeyFor(a, DEFAULT_MODEL)).toBe(cacheKeyFor(b, DEFAULT_MODEL));
    expect(cacheKeyFor(a, DEFAULT_MODEL)).not.toBe(cacheKeyFor(c, DEFAULT_MODEL));
  });
});
