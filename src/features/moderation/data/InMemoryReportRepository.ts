import type { Report } from '../domain/entities/Report';
import type { ReportRepository } from '../domain/repositories/ReportRepository';

/** Signalements en mémoire (tests). */
export class InMemoryReportRepository implements ReportRepository {
  constructor(private reports: Report[] = []) {}

  async add(report: Report): Promise<void> {
    this.reports = [...this.reports, report];
  }

  async listByReporter(reporterId: string): Promise<Report[]> {
    return this.reports.filter((r) => r.reporterId === reporterId);
  }
}
