import { moonPhase } from '../services/moonPhase';

describe('moonPhase', () => {
  it('reconnaît la nouvelle lune de référence', () => {
    expect(moonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14))).name).toBe('Nouvelle lune');
  });

  it('trouve la pleine lune environ 14,8 jours plus tard', () => {
    expect(moonPhase(new Date(Date.UTC(2000, 0, 21, 12))).name).toBe('Pleine lune');
  });
});
