// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  // Config options can be added here if needed in the future
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
