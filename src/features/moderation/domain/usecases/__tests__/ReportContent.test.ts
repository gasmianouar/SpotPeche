import { InMemoryReportRepository } from '../../../data/InMemoryReportRepository';
import { REPORT_DETAILS_MAX_LENGTH, ReportContent, ReportValidationError } from '../ReportContent';

const NOW = new Date(2026, 10, 27, 14, 0);

function setup() {
  const repository = new InMemoryReportRepository();
  let n = 0;
  const useCase = new ReportContent(repository, { next: () => `r${++n}` }, () => NOW);
  return { repository, useCase };
}

describe('ReportContent', () => {
  it('enregistre le signalement d’un spot avec sa raison', async () => {
    const { repository, useCase } = setup();

    const report = await useCase.execute({ target: { kind: 'spot', spotId: 's1' }, reason: 'forbidden', details: '  Réserve  ' }, 'me');

    expect(report).toEqual({
      id: 'r1',
      reporterId: 'me',
      target: { kind: 'spot', spotId: 's1' },
      reason: 'forbidden',
      details: 'Réserve',
      createdAt: NOW.getTime(),
    });
    expect(await repository.listByReporter('me')).toEqual([report]);
  });

  it('exige une raison', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ target: { kind: 'spot', spotId: 's1' }, reason: null, details: '' }, 'me')).rejects.toMatchObject({
      field: 'reason',
    });
  });

  it('exige une précision pour « Autre raison »', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ target: { kind: 'spot', spotId: 's1' }, reason: 'other', details: ' ' }, 'me')).rejects.toMatchObject({
      field: 'details',
    });
  });

  it('refuse des précisions trop longues', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ target: { kind: 'spot', spotId: 's1' }, reason: 'spam', details: 'a'.repeat(REPORT_DETAILS_MAX_LENGTH + 1) }, 'me'),
    ).rejects.toBeInstanceOf(ReportValidationError);
  });

  it('refuse un signalement sans utilisateur connecté', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ target: { kind: 'spot', spotId: 's1' }, reason: 'spam', details: '' }, '')).rejects.toMatchObject({
      field: 'reporter',
    });
  });

  it('ne crée pas de doublon quand on signale deux fois le même message', async () => {
    const { repository, useCase } = setup();
    const target = { kind: 'message', spotId: 's1', messageId: 'm2' } as const;

    const first = await useCase.execute({ target, reason: 'inappropriate', details: '' }, 'me');
    const second = await useCase.execute({ target, reason: 'spam', details: '' }, 'me');

    expect(second).toEqual(first);
    expect(await repository.listByReporter('me')).toHaveLength(1);
  });
});
