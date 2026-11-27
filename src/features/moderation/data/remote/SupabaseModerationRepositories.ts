import type { SupabaseClient } from '@supabase/supabase-js';

import { fromIso, throwIfError, toIso } from '@/core/supabase/supabaseClient';

import { isReportReason, type BlockedUser, type Report } from '../../domain/entities/Report';
import type { BlockRepository } from '../../domain/repositories/BlockRepository';
import type { ReportRepository } from '../../domain/repositories/ReportRepository';

/** Code PostgreSQL « valeur déjà existante » (même signalement envoyé deux fois). */
const UNIQUE_VIOLATION = '23505';

/**
 * Signalements envoyés au serveur : l'équipe de modération les voit dans Supabase
 * (table `reports`, statut « open »). L'auteur du contenu ne voit jamais qui l'a signalé.
 */
export class SupabaseReportRepository implements ReportRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async add(report: Report): Promise<void> {
    const { error } = await this.supabase.from('reports').insert({
      id: report.id,
      target_kind: report.target.kind,
      spot_id: report.target.spotId,
      message_id: report.target.kind === 'message' ? report.target.messageId : null,
      reason: report.reason,
      details: report.details,
    });
    if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
  }

  async listByReporter(reporterId: string): Promise<Report[]> {
    const rows = throwIfError(
      await this.supabase
        .from('reports')
        .select('id, reporter_id, target_kind, spot_id, message_id, reason, details, created_at')
        .eq('reporter_id', reporterId),
    ) as {
      id: string;
      reporter_id: string;
      target_kind: string;
      spot_id: string;
      message_id: string | null;
      reason: string;
      details: string;
      created_at: string;
    }[];
    return (rows ?? []).flatMap((row): Report[] =>
      isReportReason(row.reason)
        ? [
            {
              id: row.id,
              reporterId: row.reporter_id,
              target:
                row.target_kind === 'message' && row.message_id
                  ? { kind: 'message', spotId: row.spot_id, messageId: row.message_id }
                  : { kind: 'spot', spotId: row.spot_id },
              reason: row.reason,
              details: row.details,
              createdAt: fromIso(row.created_at),
            },
          ]
        : [],
    );
  }
}

/** Blocages sur le serveur : ils s'appliquent sur tous les téléphones et empêchent la personne de répondre. */
export class SupabaseBlockRepository implements BlockRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async block(entry: BlockedUser): Promise<void> {
    throwIfError(
      await this.supabase.from('user_blocks').upsert({
        blocked_id: entry.blockedId,
        blocked_name: entry.blockedName,
        created_at: toIso(entry.createdAt),
      }),
    );
  }

  async unblock(_blockerId: string, blockedId: string): Promise<void> {
    // Les règles de la base limitent la suppression aux blocages de l'utilisateur connecté.
    throwIfError(await this.supabase.from('user_blocks').delete().eq('blocked_id', blockedId));
  }

  async listBlocked(blockerId: string): Promise<BlockedUser[]> {
    const rows = throwIfError(
      await this.supabase
        .from('user_blocks')
        .select('blocker_id, blocked_id, blocked_name, created_at')
        .eq('blocker_id', blockerId)
        .order('created_at', { ascending: false }),
    ) as { blocker_id: string; blocked_id: string; blocked_name: string; created_at: string }[];
    return (rows ?? []).map((row) => ({
      blockerId: row.blocker_id,
      blockedId: row.blocked_id,
      blockedName: row.blocked_name,
      createdAt: fromIso(row.created_at),
    }));
  }

  async listBlockedIds(blockerId: string): Promise<string[]> {
    return (await this.listBlocked(blockerId)).map((b) => b.blockedId);
  }
}
