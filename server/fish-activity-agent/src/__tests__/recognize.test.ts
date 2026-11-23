import { BadModelOutputError, BadRequestError } from '../agent';
import { buildRecognizeBody, extractRecognition, parseRecognizeRequest, recognitionSchema } from '../recognize';

const CATALOG = [
  { id: 'brochet', name: 'Brochet', latinName: 'Esox lucius' },
  { id: 'sandre', name: 'Sandre', latinName: 'Sander lucioperca' },
  { id: 'perche', name: 'Perche' },
];
const validBody = () => ({ mediaType: 'image/jpeg', data: 'aGVsbG8=', catalog: CATALOG });
const apiReply = (payload: object, extra: object = {}) => ({
  model: 'claude-fable-5-2',
  stop_reason: 'end_turn',
  content: [{ type: 'text', text: JSON.stringify(payload) }],
  ...extra,
});

describe('parseRecognizeRequest', () => {
  it('accepte une requête valide', () => {
    expect(parseRecognizeRequest(validBody()).catalog).toHaveLength(3);
  });

  it.each([
    ['un format de photo non accepté', { mediaType: 'image/heic' }],
    ['une photo mal encodée', { data: 'pas du base64 !' }],
    ['un catalogue vide', { catalog: [] }],
    ['un identifiant bizarre', { catalog: [{ id: 'Brochet !', name: 'Brochet' }] }],
    ['un identifiant en double', { catalog: [CATALOG[0], CATALOG[0]] }],
  ])('refuse %s', (_label, override) => {
    expect(() => parseRecognizeRequest({ ...validBody(), ...override })).toThrow(BadRequestError);
  });

  it('refuse une photo de plus de 5 Mo', () => {
    expect(() => parseRecognizeRequest({ ...validBody(), data: 'A'.repeat(7_200_000) })).toThrow('Photo trop lourde');
  });
});

describe('buildRecognizeBody', () => {
  it('envoie la photo, le catalogue et un schéma limité aux identifiants du catalogue', () => {
    const body = buildRecognizeBody(parseRecognizeRequest(validBody()), 'claude-fable-5-2');
    const content = body.messages[0].content as { type: string; source?: { media_type: string; data: string } }[];
    expect(content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'aGVsbG8=' } });
    expect(body.system).toContain('ichtyologue');
    expect(body.system).toContain('ne montre pas de poisson');
    expect(body.output_config.format.schema).toEqual(recognitionSchema(CATALOG));
    expect(recognitionSchema(CATALOG).properties.candidates.items.properties.id.enum).toEqual(['brochet', 'sandre', 'perche']);
  });
});

describe('extractRecognition', () => {
  const request = parseRecognizeRequest(validBody());

  it('garde les propositions du catalogue, triées, bornées, sans doublon', () => {
    const result = extractRecognition(
      apiReply({
        recognized: true,
        candidates: [
          { id: 'sandre', confidence: 0.1 },
          { id: 'brochet', confidence: 1.4 },
          { id: 'baleine', confidence: 0.5 },
          { id: 'sandre', confidence: 0.3 },
        ],
        note: 'Bec de canard, dorsale reculée.',
      }),
      request,
    );
    expect(result.candidates).toEqual([
      { id: 'brochet', confidence: 1 },
      { id: 'sandre', confidence: 0.1 },
    ]);
    expect(result.recognized).toBe(true);
  });

  it('« pas reconnu » : aucune proposition, mais la note est gardée', () => {
    const result = extractRecognition(
      apiReply({ recognized: false, candidates: [{ id: 'brochet', confidence: 0.2 }], note: 'Photo trop floue.' }),
      request,
    );
    expect(result).toMatchObject({ recognized: false, candidates: [], note: 'Photo trop floue.' });
  });

  it('refuse une réponse coupée ou illisible', () => {
    expect(() => extractRecognition(apiReply({}, { stop_reason: 'max_tokens' }), request)).toThrow(BadModelOutputError);
    expect(() => extractRecognition({ content: [{ type: 'text', text: '{oups' }] }, request)).toThrow(BadModelOutputError);
  });
});
