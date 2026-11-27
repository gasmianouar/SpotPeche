/** Pourquoi un contenu est signalé (dans l'ordre d'affichage). */
export type ReportReason = 'forbidden' | 'inappropriate' | 'spam' | 'false' | 'other';

export const REPORT_REASONS: readonly ReportReason[] = ['forbidden', 'inappropriate', 'spam', 'false', 'other'];

export const isReportReason = (value: unknown): value is ReportReason => REPORT_REASONS.includes(value as ReportReason);

/** Ce qui est signalé : un spot entier, ou un message de sa discussion. */
export type ReportTarget =
  | { readonly kind: 'spot'; readonly spotId: string }
  | { readonly kind: 'message'; readonly spotId: string; readonly messageId: string };

/**
 * Un signalement envoyé à la modération.
 * L'auteur du contenu signalé ne voit jamais qui l'a signalé.
 */
export interface Report {
  readonly id: string;
  readonly reporterId: string;
  readonly target: ReportTarget;
  readonly reason: ReportReason;
  /** Précisions libres (facultatives, sauf pour « Autre raison »). */
  readonly details: string;
  /** Date d'envoi, en millisecondes depuis 1970. */
  readonly createdAt: number;
}

/** Une personne que l'utilisateur a bloquée : ses spots et messages lui sont masqués. */
export interface BlockedUser {
  readonly blockerId: string;
  readonly blockedId: string;
  /** Nom affiché au moment du blocage (pour la liste « Utilisateurs bloqués »). */
  readonly blockedName: string;
  readonly createdAt: number;
}
