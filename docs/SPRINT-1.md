# Sprint 1 — Connexion et accueil

## Ce qui a été livré

| Écran | Contenu | Ce qui est simulé |
|---|---|---|
| Connexion | Boutons « Continuer avec Facebook » et « Continuer avec Apple » (le second sur iOS uniquement), chargement, message d'erreur | La connexion elle-même : `FakeAuthRepository` renvoie un utilisateur de démo après 0,7 s |
| Accueil | Barre du haut (menu, titre, « + »), carte MapLibre + OpenFreeMap, marqueurs verts (mes spots) et rouges (communauté), légende, bouton « Me localiser », onglets Accueil / Météo | Les spots : 8 spots d'exemple en mémoire (`InMemorySpotRepository`) |
| Météo | Écran d'attente | Tout : prévu dans un prochain sprint |

Le menu, le « + » et le toucher d'un marqueur affichent « Disponible dans un prochain sprint ».

## Les choix techniques, expliqués

### Expo Router : la navigation par fichiers
Chaque fichier de `src/app/` est un écran ; son chemin donne l'URL :
- `src/app/login.tsx` → `/login`
- `src/app/(tabs)/index.tsx` → `/` (le groupe `(tabs)` n'apparaît pas dans l'URL)
- `src/app/(tabs)/meteo.tsx` → `/meteo`
- les fichiers `_layout.tsx` décrivent le conteneur : une pile (`Stack`) ou des onglets (`Tabs`).

La protection des écrans se fait dans `src/app/_layout.tsx` avec `Stack.Protected`. Tant qu'il n'y a pas d'utilisateur dans la session, seul `/login` est accessible. Dès que le ViewModel de connexion enregistre l'utilisateur, Expo Router bascule seul vers l'accueil : aucun `router.push` à écrire.

### MapLibre + OpenFreeMap : une carte 100 % gratuite
- **MapLibre** est un moteur de carte open source (licence BSD). Il dessine la carte nativement sur Android et iOS.
- **OpenFreeMap** fournit les tuiles (les « morceaux » de carte), à partir des données OpenStreetMap. C'est gratuit, sans compte et sans clé d'API.
- Le style de la carte est une simple URL : `https://tiles.openfreemap.org/styles/liberty` (dans `SpotMap.tsx`).
- L'attribution OpenStreetMap reste affichée sur la carte : la licence des données l'exige.

### Zustand : l'état global de la session
`sessionStore.ts` garde l'utilisateur connecté. N'importe quel composant peut le lire avec `useSessionStore(s => s.user)`, et il se redessine quand la valeur change.

### Pourquoi un « development build » et pas Expo Go ?
Expo Go est une app toute faite qui ne contient qu'une liste fixe de modules natifs. MapLibre n'en fait pas partie. Il faut donc compiler **notre propre** version de l'app de développement (`expo-dev-client`). On ne le fait qu'une fois, ou à chaque ajout de module natif. Ensuite, les modifications de code s'affichent instantanément, comme avec Expo Go.

### Les polices
Inter (texte) et Space Grotesk (titres), comme dans la maquette, chargées avec `@expo-google-fonts/*` dans `_layout.tsx`.

## Lancer l'app

### 1. Installer les dépendances (une seule fois)
```bash
npm install
```

### 2. Android (sur ton PC Windows)
Prérequis : Android Studio (SDK installé) et un émulateur, ou un téléphone branché en USB avec le débogage USB activé.
```bash
npx expo run:android
```
La première fois, la commande génère le dossier `android/`, compile l'app de développement et l'installe (comptez quelques minutes). Les fois suivantes, `npx expo start` suffit : l'app se connecte au serveur et se recharge à chaque sauvegarde.

### 3. iOS (sans Mac, grâce à EAS Build)
Prérequis : un compte Apple Developer (99 €/an, nécessaire de toute façon pour publier et pour « Se connecter avec Apple »).
```bash
npx eas-cli@latest login
npx eas-cli@latest device:create          # enregistre ton iPhone
npx eas-cli@latest build --profile development --platform ios
```
EAS compile l'app dans le cloud et te donne un lien pour l'installer sur l'iPhone. Ensuite, `npx expo start` sur le PC, et l'iPhone (même Wi-Fi) charge le code.

### 4. Vérifications
```bash
npm run typecheck   # TypeScript
npm test            # tests unitaires du domaine (Jest)
```

## Prochains sprints suggérés
1. Menu latéral et écran Création de spot.
2. Vraie connexion Facebook et Apple : un nouveau `AuthRepository` (seul `container.ts` change) et la session conservée au redémarrage.
3. Backend des spots (Firebase ou Supabase) et écran Fiche spot.
4. Écran Météo (API Open-Meteo, gratuite et sans clé).
