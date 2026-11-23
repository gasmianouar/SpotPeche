/**
 * Design tokens : les couleurs, typos et espacements de la maquette Spot.
 * Un seul endroit à modifier pour changer le look de toute l'app.
 */
export const colors = {
  ground: '#F2F5F4', // fond des écrans
  surface: '#FFFFFF',
  ink: '#10282C', // texte principal
  muted: '#4F6468', // texte secondaire
  border: '#DCE4E3',
  primary: '#0E5A63',
  primarySoft: '#D8ECEE',
  accent: '#E9A23B', // bouton « + »
  night: '#0C3438', // fond de l'écran de connexion
  nightText: '#B7D3D6',
  mine: '#137A42', // marqueurs verts : mes spots
  community: '#D63A2C', // marqueurs rouges : spots des autres
  facebook: '#1877F2',
  apple: '#000000',
  userLocation: '#1F6FEB',
} as const;

export const fonts = {
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 14, lg: 16, pill: 999 } as const;

/** Taille minimale d'une zone tactile (recommandation Apple / Google). */
export const touchTarget = 44;
