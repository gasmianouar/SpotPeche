import type { IdGenerator } from '@/core/ids/IdGenerator';

import { isReportReason, type Report, type ReportReason, type ReportTarget } from '../entities/Report';
import type { ReportRepository } from '../repositories/ReportRepository';

export const REPORT_DETAILS_MAX_LENGTH = 500;

/** Erreur métier : le signalement est incomplet. `field` dit quoi corriger. */
export class ReportValidationError extends Error {
  constructor(
    readonly field: 'reason' | 'details' | 'reporter',
    message: string,
  ) {
    super(message);
    this.name = 'ReportValidationError';
  }
}

export interface ReportInput {
  target: ReportTarget;
  reason: ReportReason | null;
  details: string;
}

/**
 * CAS D'USAGE : « signaler un spot ou un message ».
 * - une raison est obligatoire ; « Autre raison » demande une précision ;
 * - signaler deux fois la même chose ne crée pas de doublon (le premier signalement est renvoyé).
 */
export class ReportContent {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly idGenerator: IdGenerator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ReportInput, reporterId: string): Promise<Report> {
    if (!reporterId) throw new ReportValidationError('reporter', 'Connectez-vous pour signaler un contenu.');
    if (!isReportReason(input.reason)) throw new ReportValidationError('reason', 'Choisissez une raison.');
    const details = input.details.trim();
    if (details.length > REPORT_DETAILS_MAX_LENGTH) {
      throw new ReportValidationError('details', `Les précisions ne doivent pas dépasser ${REPORT_DETAILS_MAX_LENGTH} caractères.`);
    }
    if (input.reason === 'other' && !details) {
      throw new ReportValidationError('details', 'Précisez la raison du signalement.');
    }

    const previous = (await this.reportRepository.listByReporter(reporterId)).find((r) => sameTarget(r.target, input.target));
    if (previous) return previous;

    const report: Report = {
      id: this.idGenerator.next(),
      reporterId,
      target: input.target,
      reason: input.reason,
      details,
      createdAt: this.now().getTime(),
    };
    await this.reportRepository.add(report);
    return report;
  }
}

function sameTarget(a: ReportTarget, b: ReportTarget): boolean {
  if (a.kind === 'spot' && b.kind === 'spot') return a.spotId === b.spotId;
  if (a.kind === 'message' && b.kind === 'message') return a.messageId === b.messageId;
  return false;
}
