import type { DatabaseProvider } from '@/core/database/openDatabase';

import { isReportReason, type BlockedUser, type Report } from '../../domain/entities/Report';
import type { BlockRepository } from '../../domain/repositories/BlockRepository';
import type { ReportRepository } from '../../domain/repositories/ReportRepository';

export interface ReportRow {
  id: string;
  reporter_id: string;
  target_kind: string;
  spot_id: string;
  message_id: string | null;
  reason: string;
  details: string | null;
  created_at: number;
}

/** Ligne SQL → signalement (une ligne abîmée est ignorée : null). */
export function rowToReport(row: ReportRow): Report | null {
  if (!isReportReason(row.reason)) return null;
  const target =
    row.target_kind === 'message' && row.message_id
      ? ({ kind: 'message', spotId: row.spot_id, messageId: row.message_id } as const)
      : ({ kind: 'spot', spotId: row.spot_id } as const);
  return {
    id: row.id,
    reporterId: row.reporter_id,
    target,
    reason: row.reason,
    details: row.details ?? '',
    createdAt: row.created_at,
  };
}

/**
 * Signalements gardés dans SQLite. La colonne `sent_at` (vide pour l'instant) servira
 * à les envoyer au serveur de modération quand il existera, même après une coupure réseau.
 */
export class SqliteReportRepository implements ReportRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async add(report: Report): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      `INSERT OR IGNORE INTO reports (id, reporter_id, target_kind, spot_id, message_id, reason, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      report.id,
      report.reporterId,
      report.target.kind,
      report.target.spotId,
      report.target.kind === 'message' ? report.target.messageId : null,
      report.reason,
      report.details,
      report.createdAt,
    );
  }

  async listByReporter(reporterId: string): Promise<Report[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<ReportRow>(
      'SELECT id, reporter_id, target_kind, spot_id, message_id, reason, details, created_at FROM reports WHERE reporter_id = ?',
      reporterId,
    );
    return rows.map(rowToReport).filter((r): r is Report => r !== null);
  }
}

interface BlockRow {
  blocker_id: string;
  blocked_id: string;
  blocked_name: string | null;
  created_at: number;
}

/** Blocages gardés dans SQLite (une ligne par paire bloqueur / bloqué). */
export class SqliteBlockRepository implements BlockRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async block(entry: BlockedUser): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_blocks (blocker_id, blocked_id, blocked_name, created_at) VALUES (?, ?, ?, ?)',
      entry.blockerId,
      entry.blockedId,
      entry.blockedName,
      entry.createdAt,
    );
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?', blockerId, blockedId);
  }

  async listBlocked(blockerId: string): Promise<BlockedUser[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<BlockRow>(
      'SELECT blocker_id, blocked_id, blocked_name, created_at FROM user_blocks WHERE blocker_id = ? ORDER BY created_at DESC',
      blockerId,
    );
    return rows.map((row) => ({
      blockerId: row.blocker_id,
      blockedId: row.blocked_id,
      blockedName: row.blocked_name ?? '',
      createdAt: row.created_at,
    }));
  }

  async listBlockedIds(blockerId: string): Promise<string[]> {
    return (await this.listBlocked(blockerId)).map((b) => b.blockedId);
  }
}
