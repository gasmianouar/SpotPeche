import type { Catch } from '../entities/Catch';
import { filterByPeriod } from '../services/catchPeriods';

const aCatch = (id: string, takenAt: Date): Catch => ({
  id,
  photoUri: `file:///${id}.jpg`,
  spotId: 's1',
  placeName: 'Ponton nord',
  coordinates: { latitude: 0, longitude: 0 },
  takenAt: takenAt.getTime(),
});

describe('filterByPeriod', () => {
  const now = new Date(2026, 10, 27, 9);
  const catches = [
    aCatch('nov', new Date(2026, 10, 3)),
    aCatch('mars', new Date(2026, 2, 8)),
    aCatch('2025', new Date(2025, 10, 20)),
  ];

  it.each([
    ['all', ['nov', 'mars', '2025']],
    ['year', ['nov', 'mars']],
    ['month', ['nov']],
  ] as const)('période « %s »', (period, expected) => {
    expect(filterByPeriod(catches, period, now).map((c) => c.id)).toEqual(expected);
  });
});
