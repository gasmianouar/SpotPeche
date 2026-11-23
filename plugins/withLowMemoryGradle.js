/**
 * PLUGIN DE CONFIGURATION EXPO.
 *
 * Le dossier android/ est GÉNÉRÉ par Expo (npx expo prebuild) : une modification
 * faite à la main y serait perdue à la prochaine génération. Ce plugin applique
 * nos réglages Gradle à chaque génération.
 *
 * Réglages : moins de processus Java en parallèle, pour éviter l'erreur
 * « Failed to run Gradle Worker Daemon » sur un PC qui manque de mémoire
 * (surtout quand l'émulateur Android tourne en même temps).
 */
const { withGradleProperties } = require('expo/config-plugins');

const SETTINGS = {
  'org.gradle.parallel': 'false',
  'org.gradle.workers.max': '2',
};

module.exports = function withLowMemoryGradle(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(SETTINGS)) {
      // On retire l'ancienne valeur éventuelle, puis on ajoute la nôtre.
      cfg.modResults = cfg.modResults.filter((item) => !(item.type === 'property' && item.key === key));
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
};
