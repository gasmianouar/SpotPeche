# Sprint 2 — Menu latéral, Appâts et Météo

## Ce qui a été livré

| Fonction | Contenu |
|---|---|
| Menu latéral | S'ouvre avec l'icône ☰ de l'accueil. Contient le profil, Carte des spots, Mes spots, Favoris, **Appâts**, Carnet de prises, Météo, Paramètres, Aide & réglementation et **Se déconnecter** (avec confirmation). L'entrée de l'écran affiché est surlignée. |
| Appâts | Nouvelle route `/appats`, ouverte depuis le menu : écran d'attente « Magasins d'appâts près de vous », avec un bouton retour. |
| Météo | Onglet Météo de l'accueil : vraie météo de la ville où vous êtes (température, ressenti, vent, pression, humidité, indice de pêche, 12 prochaines heures, lever et coucher du soleil, lune, 6 jours). On peut tirer l'écran vers le bas pour rafraîchir. |

Mes spots, Favoris, Carnet de prises, Paramètres et Aide affichent encore « Disponible dans un prochain sprint ».

**Aucune nouvelle librairie native :** pas besoin de recompiler l'app de développement. Un simple `npx expo start` suffit, puis on recharge l'app.

## Comment marche la météo

```
GPS du téléphone ──► coordonnées ──┬──► nom de la ville (géocodage inverse du téléphone)
   (refusé ? lieu par défaut)      └──► prévisions Open-Meteo pour ces coordonnées
                                              │
                                indice de pêche + phase de lune (calculés dans le domaine)
```

- **`GetLocalWeather`** (cas d'usage) orchestre ces étapes. Le nom de la ville et les prévisions sont demandés **en parallèle** (`Promise.all`).
- **`OpenMeteoWeatherRepository`** appelle `api.open-meteo.com` : gratuit, sans clé, pour un usage non commercial. Le paramètre `timezone=auto` renvoie les heures dans le fuseau du lieu.
- **DTO et mapper :** `OpenMeteoResponse` décrit le JSON exact de l'API, et `mapOpenMeteoResponse` le traduit en entités du domaine. Si l'API change, seul ce fichier bouge.
- **`PlaceNameResolver`** est une interface séparée de `LocationService` (principe I de SOLID) : la carte n'a besoin que de la position, la météo a aussi besoin du nom de la ville. `ExpoLocationService` implémente les deux.
- **Indice de pêche** (`fishingIndex.ts`) : une note de 1 à 5 tirée de règles empiriques de pêcheurs. Une pression stable sur 3 h ajoute 1, une variation rapide retire 1. Un vent faible ajoute 1, un vent fort retire 1. Un orage met la note à 1. L'écran l'indique comme « indicatif ».
- **Phase de lune** (`moonPhase.ts`) : calculée localement à partir d'une nouvelle lune connue et de la durée d'une lunaison (29,53 jours). Aucune API.

## Nouvelles notions React / React Native

- **Union discriminée** pour l'état d'écran (`useWeatherViewModel.ts`) : `status: 'loading' | 'error' | 'success'`. TypeScript interdit d'afficher la météo tant qu'elle n'est pas chargée.
- **`Modal` + `Animated`** pour le menu (`AppDrawer.tsx`) : une valeur animée de 0 à 1 pilote à la fois le glissement du panneau et l'opacité du fond. `useNativeDriver: true` calcule l'animation côté natif, pour qu'elle reste fluide.
- **Store partagé** (`drawerStore.ts`) : le bouton ☰ (dans l'accueil) et le menu (posé au-dessus des onglets) sont loin l'un de l'autre dans l'arbre des composants. Un petit store Zustand les relie.
- **Menu décrit par des données** (`menuItems.ts`) : ajouter une entrée = ajouter un objet, sans toucher au composant (principe O de SOLID).
- **`RefreshControl`** : le geste « tirer pour rafraîchir » natif d'iOS et d'Android.

## Tests ajoutés (`npm test` : 22 tests)
- `fishingIndex.test.ts` : pression stable et vent faible donnent 5 ; chute de pression et vent fort donnent 1 ; orage donne 1.
- `moonPhase.test.ts` : nouvelle lune et pleine lune de référence.
- `GetLocalWeather.test.ts` : GPS accepté (ville réelle) et GPS refusé (lieu par défaut).
- `OpenMeteoWeatherRepository.test.ts` : traduction du JSON, codes météo, URL appelée, erreur réseau.

## À tester sur le téléphone
1. Accueil → ☰ : le menu glisse ; toucher le fond le referme.
2. Menu → Appâts : l'écran s'ouvre, le bouton retour revient à l'accueil.
3. Onglet Météo : accepter la localisation et vérifier que le nom de votre ville s'affiche. Refuser la localisation : le bandeau « lieu par défaut » apparaît.
4. Menu → Se déconnecter → confirmer : retour à l'écran de connexion.
