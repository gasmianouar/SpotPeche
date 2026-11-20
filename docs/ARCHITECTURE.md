# Architecture de Spot

## En une phrase

**Clean Architecture découpée par fonctionnalité (feature)**, avec en présentation un **MVVM à flux unidirectionnel** : chaque écran a un ViewModel écrit comme un *custom hook* React.

## MVVM ou MVI avec React ?

React n'impose ni l'un ni l'autre. Son principe de base est le **flux de données unidirectionnel** :

```
état ──► l'écran se dessine ──► l'utilisateur agit ──► on calcule un nouvel état ──► (retour au début)
```

C'est très proche de **MVI** (un état unique, des intentions, un nouvel état). Dans la communauté React Native, on l'écrit le plus souvent façon **MVVM** :

| Rôle | En Android/Kotlin | Dans Spot (React Native) |
|---|---|---|
| View | Fragment / Composable | `LoginScreen.tsx`, `HomeScreen.tsx` |
| ViewModel | `class LoginViewModel : ViewModel` | hook `useLoginViewModel()` |
| État d'UI | `StateFlow<LoginUiState>` | `uiState` (objet unique) |
| Actions / Intents | méthodes du ViewModel | fonctions renvoyées : `signIn(provider)` |
| Use case | `class SignInUseCase` | `class SignInWithProvider` |
| Repository | `interface AuthRepository` | `interface AuthRepository` |
| Injection (Hilt/Koin) | modules | `core/di/container.ts` + Context React |

Notre choix est donc **MVVM + un seul objet d'état** : les avantages de MVI (état prévisible) sans son côté verbeux (reducers, classes d'intentions). Si un écran devient très complexe (le formulaire de création de spot, par exemple), on pourra passer ce seul écran en MVI avec `useReducer`, sans toucher au reste.

## Les couches

```
src/
├── app/                  ← ROUTES Expo Router (fichiers très fins, aucune logique)
├── core/                 ← transverse : thème, injection de dépendances, services
├── shared/               ← types et composants UI réutilisés par plusieurs features
└── features/
    ├── auth/
    │   ├── domain/       ← entités, interfaces de repository, cas d'usage (TypeScript pur)
    │   ├── data/         ← implémentations des repositories (Fake, puis Facebook/Apple)
    │   └── presentation/ ← écrans, ViewModels, composants
    ├── spots/            ← même découpage
    └── weather/
```

**Règle des dépendances :** `presentation → domain ← data`. Le domaine ne dépend de rien : ni React, ni Expo, ni MapLibre. On peut donc le tester avec Jest sans téléphone (`npm test`).

## SOLID dans le code

- **S — Single Responsibility :** un cas d'usage = une action (`SignInWithProvider`, `GetMapSpots`) ; un composant = un rôle (`SpotMarker` dessine une épingle, rien d'autre).
- **O — Open/Closed :** pour brancher la vraie connexion Facebook, on **ajoute** une classe qui implémente `AuthRepository`, sans modifier les écrans ni les cas d'usage.
- **L — Liskov :** `FakeAuthRepository` et la future vraie implémentation sont interchangeables, car elles respectent le même contrat.
- **I — Interface Segregation :** des interfaces petites et ciblées (`SpotRepository.getAll`, `LocationService.getCurrentPosition`).
- **D — Dependency Inversion :** les cas d'usage dépendent d'interfaces. Seul `core/di/container.ts` choisit les implémentations concrètes.
