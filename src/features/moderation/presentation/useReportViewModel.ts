import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useI18n } from '@/core/i18n/useI18n';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import type { ReportReason, ReportTarget } from '../domain/entities/Report';
import { REPORT_DETAILS_MAX_LENGTH, ReportValidationError } from '../domain/usecases/ReportContent';

/** Les étapes de la feuille « Signaler ou bloquer ». */
export type ReportStep = 'loading' | 'menu' | 'report' | 'block' | 'sent' | 'blocked' | 'unavailable';

interface Person {
  id: string;
  name: string;
}

/**
 * VIEWMODEL de l'écran « Signaler ou bloquer » (/spot/[id]/signaler, ?message=… pour un message).
 * Il relit la fiche du spot pour connaître le créateur et l'auteur du message : on ne fait pas confiance
 * aux paramètres de l'URL pour savoir qui bloquer.
 */
export function useReportViewModel(spotId: string, messageId: string | undefined) {
  const router = useRouter();
  const { t } = useI18n();
  const { getSpotDetail, reportContent, blockUser } = useDependencies();
  const userId = useSessionStore((s) => s.user?.id ?? '');

  const [step, setStep] = useState<ReportStep>('loading');
  const [owner, setOwner] = useState<Person | null>(null);
  const [messageAuthor, setMessageAuthor] = useState<Person | null>(null);
  const [target, setTarget] = useState<ReportTarget>({ kind: 'spot', spotId });
  const [blockTarget, setBlockTarget] = useState<Person | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getSpotDetail
      .execute(spotId, userId)
      .then((detail) => {
        if (!active) return;
        const spotOwner = { id: detail.spot.ownerId, name: detail.spot.ownerName || t('common.fisher') };
        setOwner(detail.isMine ? null : spotOwner);
        const message = messageId ? detail.messages.find((m) => m.message.id === messageId) : undefined;
        if (message && !message.isMine) {
          setMessageAuthor({ id: message.message.author.id, name: message.message.author.name || t('common.fisher') });
          setTarget({ kind: 'message', spotId, messageId: message.message.id });
          setStep('report');
        } else {
          setStep(detail.isMine ? 'unavailable' : 'menu');
        }
      })
      .catch(() => active && setStep('unavailable'));
    return () => {
      active = false;
    };
  }, [getSpotDetail, spotId, messageId, userId, t]);

  const startReportSpot = useCallback(() => {
    setTarget({ kind: 'spot', spotId });
    setReason(null);
    setDetails('');
    setError(null);
    setStep('report');
  }, [spotId]);

  const startBlock = useCallback((person: Person) => {
    setBlockTarget(person);
    setError(null);
    setStep('block');
  }, []);

  const backToMenu = useCallback(() => {
    setError(null);
    // Un signalement de message ouvert directement (appui long) n'a pas de menu : on revient à la fiche.
    if (messageId && target.kind === 'message') router.back();
    else setStep('menu');
  }, [messageId, target.kind, router]);

  const send = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      await reportContent.execute({ target, reason, details }, userId);
      setStep('sent');
    } catch (e) {
      if (e instanceof ReportValidationError) {
        setError(
          e.field === 'reason'
            ? t('report.error.reason')
            : details.trim().length > REPORT_DETAILS_MAX_LENGTH
              ? t('report.error.tooLong', { max: REPORT_DETAILS_MAX_LENGTH })
              : t('report.error.details'),
        );
      } else {
        setError(t('report.error.save'));
      }
    } finally {
      setIsBusy(false);
    }
  }, [reportContent, target, reason, details, userId, t]);

  const confirmBlock = useCallback(async () => {
    if (!blockTarget) return;
    setIsBusy(true);
    setError(null);
    try {
      await blockUser.execute(userId, blockTarget);
      setStep('blocked');
    } catch {
      setError(t('block.error'));
    } finally {
      setIsBusy(false);
    }
  }, [blockUser, blockTarget, userId, t]);

  /** Fermer : si on vient de bloquer le créateur du spot, sa fiche n'a plus lieu d'être affichée. */
  const close = useCallback(() => {
    if (step === 'blocked' && blockTarget && blockTarget.id === owner?.id) router.dismissTo('/');
    else router.back();
  }, [step, blockTarget, owner, router]);

  return {
    step,
    owner,
    messageAuthor,
    target,
    blockTarget,
    reason,
    details,
    error,
    isBusy,
    detailsRequired: reason === 'other',
    detailsMaxLength: REPORT_DETAILS_MAX_LENGTH,
    setReason,
    setDetails,
    startReportSpot,
    startBlock,
    backToMenu,
    send,
    confirmBlock,
    close,
  };
}
