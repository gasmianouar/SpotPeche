import { Stack } from 'expo-router';

/**
 * Compte et confidentialité : une pile d'écrans à part.
 *   /compte           → réglages (comptes de connexion, notifications, visibilité, bloqués, langue)
 *   /compte/supprimer → supprimer mon compte
 */
export default function AccountLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
