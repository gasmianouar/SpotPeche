# Sprint 9 : l'app en arabe, en français et en anglais

## Ce qui change
- **Tous les écrans** sont traduits :
  - connexion, menu, accueil (carte), météo ;
  - création d'un spot, choix des espèces et des appâts, reconnaissance photo ;
  - fiche spot (messages, réactions, itinéraire, partage), météo du spot, Mes prises, composants open source.
- **La langue** se choisit sur l'écran de connexion (العربية · Français · English). Elle est gardée sur le téléphone. La première fois, l'app prend la langue du téléphone si c'est l'une des trois, sinon le français.
- **Arabe = de droite à gauche pour toute l'app.** Android et iOS retournent la mise en page (lignes, marges, flèches « retour »). Ce réglage ne s'applique qu'au démarrage : l'app redémarre aussitôt quand on passe à l'arabe, ou quand on le quitte.
- **Les dates** (mois, jours de la semaine, « 23 nov. » / « Nov 23 » / « 23 نوفمبر ») et les directions du vent sont traduites.
- **Les noms des 60 espèces et des 8 appâts** sont traduits. La recherche fonctionne dans les trois langues : « bar », « seabass » et « القاروص » trouvent la même espèce.
- **Le message partagé** (WhatsApp, Messenger…) est écrit dans la langue de l'app.

## Comment c'est organisé
```
core/i18n/
  languages.ts        les 3 langues, la langue du téléphone
  defineTexts.ts      le français sert de référence : en et ar doivent avoir exactement les mêmes clés (vérifié par TypeScript)
  commonTexts.ts      Retour, Réessayer, Annuler…
  translations.ts     réunit les textes de toutes les features ; translate(langue, clé, { variables })
  dates.ts            mois et jours, formats de date
  useI18n.ts          pour les écrans : { t, language, isRTL } (aucune dépendance)
  useLanguageChooser.ts  changer de langue : enregistrement + sens de lecture ; RestoreLanguage au démarrage
  rtl.ts              I18nManager.forceRTL + redémarrage
  KvLanguageRepository.ts / LanguagePreference.ts  langue choisie, gardée sur le téléphone
features/<feature>/presentation/texts.ts   les textes de chaque feature, dans les 3 langues
features/spots/presentation/catalog/catalogTexts.ts + catalogName.ts   noms du catalogue
```
- **Une clé par texte** (`'detail.share'`), avec des variables : `t('catches.summary', { count, date })`.
- **Le domaine ne change presque pas** : il garde ses valeurs (« Pleine lune », « Pression stable », les erreurs de validation). La présentation les traduit à l'affichage (`moonPhaseKey`, `translateReason`, `recognitionNoteText`…).
- **Ajouter une langue** : l'ajouter dans `languages.ts`. TypeScript signale alors chaque fichier `texts.ts` à compléter.

## Ce qui reste en français
- **Les contenus écrits par les utilisateurs** (messages, descriptions) et les noms des spots, fabriqués à leur création.
- **Les analyses de l'agent IA** (s'il est mis en ligne) : il répond en français.

## À faire valider
- **Les noms arabes des poissons** : ce sont les plus répandus, mais ils varient d'un pays à l'autre (Maroc, Algérie, Tunisie, Moyen-Orient). À relire par un pêcheur arabophone.
- **Les textes arabes en général** : relecture par un locuteur natif conseillée avant publication.

## Tests
- `core/i18n/__tests__/i18n.test.ts` : langue du téléphone, clés identiques dans les 3 langues, langue choisie prioritaire.
- Formats de date en 3 langues : `catchFormat.test.ts`, `detail/__tests__/format.test.ts`.
