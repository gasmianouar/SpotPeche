import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import { DependenciesProvider } from '@/core/di/DependenciesProvider';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

/**
 * LAYOUT RACINE (Expo Router) : il enveloppe toute l'app.
 * 1. charge les polices de la maquette ;
 * 2. fournit les dépendances (DependenciesProvider) ;
 * 3. protège les routes : connecté → onglets, sinon → connexion.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const isSignedIn = useSessionStore((state) => state.user !== null);

  // L'écran de démarrage (splash) reste affiché tant que les polices chargent.
  if (!fontsLoaded) return null;

  return (
    <DependenciesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Stack.Protected : une route n'est accessible que si `guard` est vrai.
            Sinon Expo Router redirige automatiquement vers une route autorisée. */}
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="appats" />
          <Stack.Screen name="nouveau-spot" />
          <Stack.Screen name="spot/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </DependenciesProvider>
  );
}
