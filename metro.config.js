// Configuration Metro (empaqueteur JavaScript d'Expo).
// On ajoute l'extension .pte : les modèles ExecuTorch de la reconnaissance embarquée (assets/models) sont des assets.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('pte');

module.exports = config;
