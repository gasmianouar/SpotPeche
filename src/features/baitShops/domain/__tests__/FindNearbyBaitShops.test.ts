import { BAIT_SHOP_QUERY, FindNearbyBaitShops } from '../usecases/FindNearbyBaitShops';

describe('FindNearbyBaitShops', () => {
  it('lance la recherche des magasins de pêche autour de l’utilisateur', async () => {
    const search = { searchNearby: jest.fn().mockResolvedValue(undefined) };
    await new FindNearbyBaitShops(search).execute();
    expect(search.searchNearby).toHaveBeenCalledWith(BAIT_SHOP_QUERY);
    expect(BAIT_SHOP_QUERY).toBe('magasin articles de pêche');
  });
});
