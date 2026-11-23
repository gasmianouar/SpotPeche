import type { DatabaseProvider } from '@/core/database/openDatabase';

import type { Spot } from '../../domain/entities/Spot';
import type { SpotRepository } from '../../domain/repositories/SpotRepository';

/** Une ligne de la table `spots`, telle que SQLite la renvoie. */
export interface SpotRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  owner_id: string;
}

/** Ligne SQL → entité du domaine (snake_case → camelCase, coordonnées regroupées). */
export function rowToSpot(row: SpotRow): Spot {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
  };
}

const SELECT_SPOTS = 'SELECT id, name, latitude, longitude, owner_id FROM spots';

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

  async getByOwner(ownerId: string): Promise<Spot[]> {
    const db = await this.getDatabase();
    // Le filtre est fait par SQLite (WHERE), grâce à l'index idx_spots_owner.
    const rows = await db.getAllAsync<SpotRow>(`${SELECT_SPOTS} WHERE owner_id = ? ORDER BY created_at DESC`, ownerId);
    return rows.map(rowToSpot);
  }
}
