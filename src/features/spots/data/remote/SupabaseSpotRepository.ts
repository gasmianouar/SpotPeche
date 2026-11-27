import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabasePhotoStorage } from '@/core/supabase/SupabasePhotoStorage';
import { fromIso, requireUserId, throwIfError, toIso } from '@/core/supabase/supabaseClient';

import { isFishActivity, isSpotVisibility, type Spot } from '../../domain/entities/Spot';
import type { SpotRepository } from '../../domain/repositories/SpotRepository';

/** Une ligne de la table `spots` dans Supabase. */
export interface SpotRecord {
  id: string;
  owner_id: string | null;
  owner_name: string;
  owner_photo: string | null;
  name: string;
  latitude: number;
  longitude: number;
  species_ids: string[];
  bait_ids: string[];
  activity: string | null;
  visibility: string;
  description: string;
  photos: string[];
  created_at: string;
}

const COLUMNS =
  'id, owner_id, owner_name, owner_photo, name, latitude, longitude, species_ids, bait_ids, activity, visibility, description, photos, created_at';

/** Ligne Supabase → entité du domaine (photos : chemins → adresses signées). */
export function recordToSpot(record: SpotRecord, photoUrls: Map<string, string>): Spot {
  return {
    id: record.id,
    name: record.name,
    coordinates: { latitude: record.latitude, longitude: record.longitude },
    // Compte supprimé mais spot gardé anonymement : plus de créateur.
    ownerId: record.owner_id ?? '',
    ownerName: record.owner_name,
    ownerPhotoUrl: record.owner_photo,
    speciesIds: record.species_ids ?? [],
    baitIds: record.bait_ids ?? [],
    activity: isFishActivity(record.activity) ? record.activity : null,
    visibility: isSpotVisibility(record.visibility) ? record.visibility : 'private',
    description: record.description ?? '',
    photoUris: (record.photos ?? []).map((path) => photoUrls.get(path)).filter((url): url is string => Boolean(url)),
    createdAt: fromIso(record.created_at),
  };
}

/**
 * Spots sur le serveur Supabase. Les règles de la base font le tri :
 * on ne reçoit que les spots publics (hors personnes bloquées) et les siens.
 */
export class SupabaseSpotRepository implements SpotRepository {
  private readonly photos: SupabasePhotoStorage;

  constructor(private readonly supabase: SupabaseClient) {
    this.photos = new SupabasePhotoStorage(supabase);
  }

  async getAll(): Promise<Spot[]> {
    return this.load(this.supabase.from('spots').select(COLUMNS).order('created_at', { ascending: false }));
  }

  async getById(id: string): Promise<Spot | null> {
    const [spot] = await this.load(this.supabase.from('spots').select(COLUMNS).eq('id', id).limit(1));
    return spot ?? null;
  }

  async getByOwner(ownerId: string): Promise<Spot[]> {
    if (!ownerId) return [];
    return this.load(
      this.supabase.from('spots').select(COLUMNS).eq('owner_id', ownerId).order('created_at', { ascending: false }),
    );
  }

  async save(spot: Spot): Promise<void> {
    const userId = await requireUserId(this.supabase);
    if (spot.ownerId !== userId) {
      // Spot d'un autre pêcheur : on ne peut que compléter ses espèces et appâts (fonction du serveur).
      throwIfError(
        await this.supabase.rpc('add_spot_items', {
          p_spot_id: spot.id,
          p_species: [...spot.speciesIds],
          p_baits: [...spot.baitIds],
        }),
      );
      return;
    }
    const photos = await this.photos.toStoragePaths(spot.photoUris);
    // Le créateur et son nom sont remplis par le serveur : inutile (et impossible) de les envoyer.
    throwIfError(
      await this.supabase.from('spots').upsert({
        id: spot.id,
        name: spot.name,
        latitude: spot.coordinates.latitude,
        longitude: spot.coordinates.longitude,
        species_ids: [...spot.speciesIds],
        bait_ids: [...spot.baitIds],
        activity: spot.activity,
        visibility: spot.visibility,
        description: spot.description,
        photos,
        created_at: toIso(spot.createdAt),
      }),
    );
  }

  private async load(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<Spot[]> {
    const records = (throwIfError(await query) ?? []) as SpotRecord[];
    const urls = await this.photos.toDisplayUrls(records.flatMap((r) => r.photos ?? []));
    return records.map((record) => recordToSpot(record, urls));
  }
}
