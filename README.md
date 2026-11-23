# Spot — l'app des pêcheurs amateurs

Application mobile iOS et Android (React Native + Expo, TypeScript) pour repérer, enregistrer et partager des spots de pêche.

- Architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Lancer l'app : [docs/SPRINT-1.md](docs/SPRINT-1.md)
- Sprint 2 (menu, Appâts, météo) : [docs/SPRINT-2.md](docs/SPRINT-2.md)
- Sprint 3 (Mes spots hors connexion, déconnexion) : [docs/SPRINT-3.md](docs/SPRINT-3.md)
- Sprint 4 (création d'un spot, GPS exact, reconnaissance IA) : [docs/SPRINT-4.md](docs/SPRINT-4.md)
- Sprint 5 (fiche spot, discussion façon Messenger) : [docs/SPRINT-5.md](docs/SPRINT-5.md)
- Sprint 6 (agent IA : activité des poissons, indice de pêche) : [docs/SPRINT-6.md](docs/SPRINT-6.md)

```bash
npm install
npx expo run:android   # première fois (development build)
npx expo start         # ensuite
npm test               # tests unitaires
```

Carte : MapLibre + OpenFreeMap. Données © contributeurs OpenStreetMap. Météo : Open-Meteo.com.
