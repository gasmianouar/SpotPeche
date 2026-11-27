import { useLocalSearchParams } from 'expo-router';

import { ReportScreen } from '@/features/moderation/presentation/ReportScreen';

// Route « /spot/[id]/signaler » : signaler le spot ou bloquer son créateur ;
// « ?message=<id> » ouvre directement le signalement d'un message (appui long dans la discussion).
export default function ReportRoute() {
  const { id, message } = useLocalSearchParams<{ id: string; message?: string }>();
  return <ReportScreen spotId={id} messageId={message} />;
}
