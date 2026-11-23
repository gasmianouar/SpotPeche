import type { DatabaseProvider } from '@/core/database/openDatabase';

import type { FishActivity, Spot } from '../../domain/entities/Spot';
import type { SpotRepository } from '../../domain/repositories/SpotRepository';
import { parseList } from './jsonColumns';

/** Une ligne de la table `spots`, telle que SQLite la renvoie. */
export interface SpotRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  owner_id: string;
  owner_name: string | null;
  owner_photo: string | null;
  species: string | null;
  baits: string | null;
  activity: string | null;
  description: string | null;
  photos: string | null;
  created_at: number;
}

const ACTIVITIES: readonly FishActivity[] = ['good', 'medium', 'none'];

/** Ligne SQL → entité du domaine (snake_case → camelCase, JSON → tableaux). */
export function rowToSpot(row: SpotRow): Spot {
  const activity = ACTIVITIES.find((a) => a === row.activity) ?? null;
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? '',
    ownerPhotoUrl: row.owner_photo ?? null,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    speciesIds: parseList(row.species),
    baitIds: parseList(row.baits),
    activity,
    description: row.description ?? '',
    photoUris: parseList(row.photos),
    createdAt: row.created_at,
  };
}

/** Entité du domaine → valeurs à insérer, dans l'ordre des colonnes de INSERT_SPOT. */
export function spotToParams(spot: Spot): (string | number | null)[] {
  return [
    spot.id,
    spot.name,
    spot.coordinates.latitude,
    spot.coordinates.longitude,
    spot.ownerId,
    spot.ownerName,
    spot.ownerPhotoUrl,
    JSON.stringify(spot.speciesIds),
    JSON.stringify(spot.baitIds),
    spot.activity,
    spot.description,
    JSON.stringify(spot.photoUris),
    spot.createdAt,
  ];
}

const SELECT_SPOTS =
  'SELECT id, name, latitude, longitude, owner_id, owner_name, owner_photo, species, baits, activity, description, photos, created_at FROM spots';

const INSERT_SPOT =
  'INSERT OR REPLACE INTO spots (id, name, latitude, longitude, owner_id, owner_name, owner_photo, species, baits, activity, description, photos, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

/**
 * Spots stockés dans la base SQLite du téléphone : disponibles hors connexion.
 * Les écrans et les cas d'usage ne savent pas que c'est du SQL.
 */
export class SqliteSpotRepository implements SpotRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async getAll(): Promise<Spot[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<SpotRow>(`${SELECT_SPOTS} ORDER BY created_at DESC`);
    return rows.map(rowToSpot);
  }

  async getById(id: string): Promise<Spot | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<SpotRow>(`${SELECT_SPOTS} WHERE id = ?`, id);
    return row ? rowToSpot(row) : null;
  }

  async getByOwner(ownerId: string): Promise<Spot[]> {
    const db = await this.getDatabase();
    // Le filtre est fait par SQLite (WHERE), grâce à l'index idx_spots_owner.
    const rows = await db.getAllAsync<SpotRow>(`${SELECT_SPOTS} WHERE owner_id = ? ORDER BY created_at DESC`, ownerId);
    return rows.map(rowToSpot);
  }

  async save(spot: Spot): Promise<void> {
    const db = await this.getDatabase();
    // Requête paramétrée : les valeurs sont passées à part, jamais collées dans le SQL.
    await db.runAsync(INSERT_SPOT, spotToParams(spot));
  }
}
