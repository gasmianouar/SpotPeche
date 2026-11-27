import type { SupabaseClient } from '@supabase/supabase-js';

import { aSpot } from '@/features/spots/testing/spotTestData';

import { recordToMessage } from '../SupabaseMessageRepositories';
import { recordToSpot, SupabaseSpotRepository, type SpotRecord } from '../SupabaseSpotRepository';

// jest.mock est remonté avant les imports par Jest.
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-sqlite/localStorage/install', () => ({}));

const ME = '0b1c2d3e-0000-4000-8000-000000000001';

/** Faux client Supabase : enregistre les appels, répond « succès ». */
function fakeSupabase() {
  const calls: { kind: string; table?: string; payload?: unknown }[] = [];
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: ME } } } }) },
    rpc: async (name: string, payload: unknown) => {
      calls.push({ kind: 'rpc', table: name, payload });
      return { data: null, error: null };
    },
    from: (table: string) => ({
      upsert: async (payload: unknown) => {
        calls.push({ kind: 'upsert', table, payload });
        return { data: null, error: null };
      },
    }),
    storage: { from: () => ({ createSignedUrls: async () => ({ data: [] }) }) },
  };
  return { calls, supabase: supabase as unknown as SupabaseClient };
}

describe('SupabaseSpotRepository.save', () => {
  it('mon spot : il est écrit dans la table, sans le créateur (rempli par le serveur)', async () => {
    const { calls, supabase } = fakeSupabase();

    await new SupabaseSpotRepository(supabase).save(aSpot({ id: 's9', ownerId: ME, visibility: 'private', photoUris: [] }));

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ kind: 'upsert', table: 'spots', payload: { id: 's9', visibility: 'private' } });
    expect(calls[0].payload).not.toHaveProperty('owner_id');
    expect(calls[0].payload).not.toHaveProperty('owner_name');
  });

  it('le spot d’un autre : on passe par la fonction serveur qui ne fait qu’ajouter espèces et appâts', async () => {
    const { calls, supabase } = fakeSupabase();

    await new SupabaseSpotRepository(supabase).save(aSpot({ id: 's1', ownerId: 'quelqu-un-d-autre', speciesIds: ['brochet', 'perche'] }));

    expect(calls).toEqual([
      { kind: 'rpc', table: 'add_spot_items', payload: { p_spot_id: 's1', p_species: ['brochet', 'perche'], p_baits: ['shad'] } },
    ]);
  });
});

describe('Conversion des lignes Supabase', () => {
  const record: SpotRecord = {
    id: 's1',
    owner_id: null,
    owner_name: '',
    owner_photo: null,
    name: 'Ponton',
    latitude: 48.78,
    longitude: 2.44,
    species_ids: ['brochet'],
    bait_ids: [],
    activity: 'inconnu',
    visibility: 'bizarre',
    description: 'x',
    photos: [`${ME}/a.jpg`, `${ME}/manquante.jpg`],
    created_at: '2026-11-23T07:40:00.000Z',
  };

  it('spot anonyme, valeurs inconnues rendues prudentes, photos signées seulement si disponibles', () => {
    const spot = recordToSpot(record, new Map([[`${ME}/a.jpg`, 'https://signed/a']]));

    expect(spot.ownerId).toBe('');
    expect(spot.activity).toBeNull();
    expect(spot.visibility).toBe('private');
    expect(spot.photoUris).toEqual(['https://signed/a']);
    expect(spot.createdAt).toBe(Date.UTC(2026, 10, 23, 7, 40));
  });

  it('message avec citation', () => {
    const message = recordToMessage(
      {
        id: 'm1',
        spot_id: 's1',
        author_id: ME,
        author_name: 'Léa M.',
        author_photo: null,
        text: 'Merci',
        photos: [],
        reply_to_id: 's1#post',
        reply_author: 'Karim B.',
        reply_excerpt: 'Ponton en bois',
        created_at: '2026-11-23T10:15:00.000Z',
      },
      new Map(),
    );
    expect(message.replyTo).toEqual({ messageId: 's1#post', authorName: 'Karim B.', excerpt: 'Ponton en bois' });
    expect(message.author.name).toBe('Léa M.');
  });
});
