import type { Report } from '../entities/Report';

/**
 * Contrat d'envoi des signalements.
 * Aujourd'hui : gardés sur le téléphone. Demain : envoyés au serveur de modération
 * (seul core/di/container.ts changera).
 */
export interface ReportRepository {
  add(report: Report): Promise<void>;
  /** Les signalements faits par une personne (pour ne pas signaler deux fois la même chose). */
  listByReporter(reporterId: string): Promise<Report[]>;
}
