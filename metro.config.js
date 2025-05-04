const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const defaultConfig = getDefaultConfig(__dirname);


defaultConfig.resolver.sourceExts.push('cjs');

// This is the new line you should add in, after the previous lines
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(defaultConfig, { input: './app/globals.css' })