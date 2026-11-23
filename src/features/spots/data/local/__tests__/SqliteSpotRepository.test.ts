import { rowToSpot } from '../SqliteSpotRepository';

jest.mock('expo-sqlite', () => ({}));

describe('rowToSpot', () => {
  it('convertit une ligne SQL en entité Spot', () => {
    expect(rowToSpot({ id: 's6', name: 'Ponton des Saules', latitude: 48.777, longitude: 2.4466, owner_id: 'me' })).toEqual({
      id: 's6',
      name: 'Ponton des Saules',
      ownerId: 'me',
      coordinates: { latitude: 48.777, longitude: 2.4466 },
    });
  });
});
