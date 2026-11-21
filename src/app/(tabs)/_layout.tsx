import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';

import { colors, fonts } from '@/core/theme/tokens';
import { AppDrawer } from '@/features/menu/presentation/AppDrawer';

/**
 * Barre de navigation du bas : Accueil et Météo.
 * Le dossier « (tabs) » entre parenthèses est un GROUPE : il organise les
 * fichiers sans apparaître dans l'URL.
 */
export default function TabsLayout() {
  // Fragment <>…</> : on renvoie les onglets ET le menu latéral, posé par-dessus.
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 12 },
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="meteo"
          options={{
            title: 'Météo',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cloud' : 'cloud-outline'} size={22} color={color as string} />
            ),
          }}
        />
      </Tabs>
      <AppDrawer />
    </>
  );
}
