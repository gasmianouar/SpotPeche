import { aContext } from '../../testing/forecastTestData';
import type { FishingForecast } from '../../domain/entities/FishingForecast';
import type { FishActivityAdvisor } from '../../domain/ports/FishActivityAdvisor';
import { fromAiResponse, InvalidAiResponseError, toAiRequest } from '../aiForecastContract';
import { CachedFishActivityAdvisor } from '../CachedFishActivityAdvisor';
import { LocalFishActivityAdvisor } from '../LocalFishActivityAdvisor';
import { RemoteAiFishActivityAdvisor } from '../RemoteAiFishActivityAdvisor';
import { ResilientFishActivityAdvisor } from '../ResilientFishActivityAdvisor';

const context = aContext();
const validResponse = () => ({
  model: 'claude-fable-5-2',
  index_score: 4.4,
  summary: '  Belle fenêtre au crépuscule.  ',
  reasons: ['Pression en légère baisse', 'Vent faible', 'Crépuscule', 'En trop'],
  hourly: context.weather.hourly.map((h, i) => ({ time: h.localTime, score: i === 8 ? 140 : 50 })),
  best_window_start: '2026-11-23T16:00',
  best_window_end: '2026-11-23T18:00',
  confidence: 'high',
});

describe('contrat de l’agent IA', () => {
  it('envoie seulement les données utiles, coordonnées arrondies', () => {
    const request = toAiRequest(aContext({ coordinates: { latitude: 48.781234567, longitude: 2.445512345 } }));

    expect(request.latitude).toBe(48.7812);
    expect(request.longitude).toBe(2.4455);
    expect(request.hours[0]).toEqual({ time: '2026-11-23T08:00', temperature: 10, pressure: 1015, wind: 10, sky: 'overcast' });
    expect(request.sun).toEqual([{ date: '2026-11-23', sunrise: '2026-11-23T08:10', sunset: '2026-11-23T17:00' }]);
    expect(Object.keys(request)).not.toContain('spotId');
  });

  it('valide la réponse : bornes, textes raccourcis, niveaux et libellé recalculés', () => {
    const forecast = fromAiResponse(validResponse(), context);

    expect(forecast.source).toBe('ai');
    expect(forecast.model).toBe('claude-fable-5-2');
    expect(forecast.index).toEqual({
      score: 4,
      label: 'Bon',
      summary: 'Belle fenêtre au crépuscule.',
      reasons: ['Pression en légère baisse', 'Vent faible', 'Crépuscule'],
    });
    expect(forecast.hourly[8]).toEqual({ localTime: '2026-11-23T16:00', score: 100, level: 'good' });
    expect(forecast.hourly[0].level).toBe('medium');
    expect(forecast.bestWindow).toEqual({ start: '2026-11-23T16:00', end: '2026-11-23T18:00' });
    expect(forecast.confidence).toBe('high');
  });

  it('refuse une réponse où il manque une heure', () => {
    const response = validResponse();
    response.hourly.pop();
    expect(() => fromAiResponse(response, context)).toThrow(InvalidAiResponseError);
    expect(() => fromAiResponse('n’importe quoi', context)).toThrow(InvalidAiResponseError);
  });

  it('un créneau mal formé devient « pas de créneau »', () => {
    expect(fromAiResponse({ ...validResponse(), best_window_start: '' }, context).bestWindow).toBeNull();
  });
});

describe('RemoteAiFishActivityAdvisor', () => {
  it('appelle /forecast sur le serveur et traduit la réponse', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true, json: async () => validResponse() });
    const advisor = new RemoteAiFishActivityAdvisor('https://agent.exemple.test/', fetchFn as unknown as typeof fetch);

    const forecast = await advisor.advise(context);

    expect(fetchFn).toHaveBeenCalledWith(
      'https://agent.exemple.test/forecast',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'x-spot-client': 'spot-app/1' }) }),
    );
    expect(forecast.index.score).toBe(4);
  });

  it('échoue si le serveur répond une erreur', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 502 });
    const advisor = new RemoteAiFishActivityAdvisor('https://agent.exemple.test', fetchFn as unknown as typeof fetch);

    await expect(advisor.advise(context)).rejects.toThrow('502');
  });
});

describe('décorateurs', () => {
  const failing: FishActivityAdvisor = { advise: async () => Promise.reject(new Error('hors connexion')) };

  it('repli automatique : si l’IA échoue, l’algorithme local répond et le signale', async () => {
    const forecast = await new ResilientFishActivityAdvisor(failing, new LocalFishActivityAdvisor()).advise(context);

    expect(forecast.source).toBe('local');
    expect(forecast.fallbackReason).toContain('injoignable');
  });

  it('cache : la même analyse IA n’est pas redemandée pendant 30 min', async () => {
    const aiForecast = { ...fromAiResponse(validResponse(), context) } as FishingForecast;
    const inner = { advise: jest.fn().mockResolvedValue(aiForecast) };
    let now = 0;
    const cached = new CachedFishActivityAdvisor(inner, 30 * 60_000, () => now);

    await cached.advise(context);
    now = 10 * 60_000;
    await cached.advise(context);
    expect(inner.advise).toHaveBeenCalledTimes(1);

    now = 31 * 60_000;
    await cached.advise(context);
    expect(inner.advise).toHaveBeenCalledTimes(2);
  });

  it('cache : une estimation locale n’est pas gardée (on retentera l’IA)', async () => {
    const inner = { advise: jest.fn().mockResolvedValue({ source: 'local' }) };
    const cached = new CachedFishActivityAdvisor(inner);

    await cached.advise(context);
    await cached.advise(context);
    expect(inner.advise).toHaveBeenCalledTimes(2);
  });
});
