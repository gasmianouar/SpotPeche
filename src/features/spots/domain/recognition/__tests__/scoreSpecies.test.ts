import { DEFAULT_SCORE_OPTIONS, scoreSpecies, UNSURE_NOTE, type ScoreOptions, type SpeciesHead } from '../scoreSpecies';

// Empreintes de dimension 3 pour la lisibilité (256 dans l'app). Chaque classe « regarde » un axe.
const HEAD: SpeciesHead = {
  classIds: ['bar', 'daurade', 'mulet', 'mulet'], // deux classes (deux espèces de mulets) pour un même groupe
  weights: [
    [10, 0, 0],
    [0, 10, 0],
    [0, 0, 10],
    [0, 0, 9],
  ],
  bias: [0, 0, 0, 0],
};
const OPTIONS: ScoreOptions = { minConfidence: 0, maxCandidates: 3 };

describe('scoreSpecies', () => {
  it('propose d’abord l’espèce la plus probable', () => {
    expect(scoreSpecies({ embedding: [1, 0, 0], head: HEAD }, OPTIONS).candidates[0].id).toBe('bar');
    expect(scoreSpecies({ embedding: [0, 1, 0], head: HEAD }, OPTIONS).candidates[0].id).toBe('daurade');
  });

  it('additionne les probabilités des espèces d’un même groupe du catalogue', () => {
    // Sans regroupement, chaque mulet aurait moins que le bar ; ensemble, ils passent devant.
    const embedding = [0.6, 0, 0.58]; // scores : bar 6, mulets 5,8 et 5,22
    const outcome = scoreSpecies({ embedding, head: HEAD }, OPTIONS);
    expect(outcome.candidates[0].id).toBe('mulet');
    expect(outcome.candidates.map((c) => c.id)).toEqual(['mulet', 'bar', 'daurade']);
  });

  it('donne des confiances triées, entre 0 et 1, dont la somme vaut 1', () => {
    const { candidates } = scoreSpecies({ embedding: [0.3, 0.2, 0.1], head: HEAD }, OPTIONS);
    for (let i = 1; i < candidates.length; i++) expect(candidates[i - 1].confidence).toBeGreaterThanOrEqual(candidates[i].confidence);
    expect(candidates.reduce((sum, c) => sum + c.confidence, 0)).toBeCloseTo(1);
  });

  it('garde au plus maxCandidates propositions', () => {
    expect(scoreSpecies({ embedding: [0.3, 0.2, 0.1], head: HEAD }, { ...OPTIONS, maxCandidates: 2 }).candidates).toHaveLength(2);
  });

  it('répond « je ne sais pas » si la meilleure confiance est sous le seuil', () => {
    const outcome = scoreSpecies({ embedding: [0, 0, 0], head: HEAD }, { ...OPTIONS, minConfidence: 0.6 }); // 4 classes à égalité : mulet 0,5, bar et daurade 0,25
    expect(outcome).toEqual({ candidates: [], note: UNSURE_NOTE });
  });

  it('reste stable avec de très grands scores (pas de débordement numérique)', () => {
    const { candidates } = scoreSpecies({ embedding: [1000, 0, 0], head: HEAD }, OPTIONS);
    expect(candidates[0]).toEqual({ id: 'bar', confidence: expect.closeTo(1) });
  });

  it('a des réglages par défaut calibrés au contrôle du 24/11', () => {
    expect(DEFAULT_SCORE_OPTIONS).toEqual({ minConfidence: 0.1, maxCandidates: 3 });
  });
});
