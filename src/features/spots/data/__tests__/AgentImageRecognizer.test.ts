import { parseDataUrl, type PhotoReader } from '@/core/media/PhotoReader';

import { PhotoTooLargeError, RecognitionUnavailableError } from '../../domain/recognition/ImageRecognizer';
import { AgentImageRecognizer, parseAgentReply } from '../recognition/AgentImageRecognizer';

const reader = (data = 'aGVsbG8=', mediaType = 'image/jpeg'): PhotoReader => ({ read: jest.fn().mockResolvedValue({ data, mediaType }) });
const reply = (status: number, body: unknown) =>
  jest.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as typeof fetch;

describe('AgentImageRecognizer', () => {
  it('envoie la photo et le catalogue à /recognize', async () => {
    const fetchFn = reply(200, { recognized: true, candidates: [{ id: 'brochet', confidence: 0.9 }], note: 'Bec de canard.' });
    const recognizer = new AgentImageRecognizer('https://agent.example/', reader(), fetchFn);

    const outcome = await recognizer.recognize('file:///prise.jpg');

    expect(outcome).toEqual({ candidates: [{ id: 'brochet', confidence: 0.9 }], note: 'Bec de canard.' });
    const [url, init] = (fetchFn as jest.Mock).mock.calls[0];
    expect(url).toBe('https://agent.example/recognize');
    expect(init.headers['x-spot-client']).toBe('spot-app/1');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ mediaType: 'image/jpeg', data: 'aGVsbG8=' });
    expect(body.kind).toBeUndefined();
    expect(body.catalog.map((c: { id: string }) => c.id)).toContain('sandre');
    expect(recognizer.isDemo).toBe(false);
  });

  it('refuse une photo trop lourde sans l’envoyer', async () => {
    const fetchFn = reply(200, {});
    const recognizer = new AgentImageRecognizer('https://a', reader('A'.repeat(7_200_000)), fetchFn);
    await expect(recognizer.recognize('file:///p.jpg')).rejects.toBeInstanceOf(PhotoTooLargeError);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('signale un serveur en panne ou injoignable', async () => {
    await expect(new AgentImageRecognizer('https://a', reader(), reply(502, {})).recognize('f')).rejects.toBeInstanceOf(
      RecognitionUnavailableError,
    );
    const offline = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
    await expect(new AgentImageRecognizer('https://a', reader(), offline).recognize('f')).rejects.toBeInstanceOf(
      RecognitionUnavailableError,
    );
  });
});

describe('parseAgentReply', () => {
  it('« pas reconnu » : aucune proposition, la note est gardée', () => {
    expect(parseAgentReply({ recognized: false, candidates: [{ id: 'brochet', confidence: 0.4 }], note: 'Trop flou.' })).toEqual({
      candidates: [],
      note: 'Trop flou.',
    });
  });

  it('écarte les propositions mal formées', () => {
    expect(
      parseAgentReply({ recognized: true, candidates: [{ id: 'brochet', confidence: 'beaucoup' }, { id: 'sandre', confidence: 0.6 }, null] }),
    ).toEqual({ candidates: [{ id: 'sandre', confidence: 0.6 }], note: undefined });
  });
});

describe('parseDataUrl', () => {
  it('sépare le format et le contenu', () => {
    expect(parseDataUrl('data:image/png;base64,QUJD')).toEqual({ mediaType: 'image/png', data: 'QUJD' });
  });

  it('suppose du JPEG quand le téléphone ne donne pas de type', () => {
    expect(parseDataUrl('data:application/octet-stream;base64,QUJD')).toEqual({ mediaType: 'image/jpeg', data: 'QUJD' });
  });
});
