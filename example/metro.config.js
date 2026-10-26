const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch monorepo root so changes to packages/react-native-cockpit trigger fast refresh
config.watchFolders = [monorepoRoot];

// 2. Resolve node_modules from both example and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Map react-native-cockpit directly to source for instant live development
config.resolver.extraNodeModules = {
  'react-native-cockpit': path.resolve(monorepoRoot, 'packages/react-native-cockpit/src'),
};

module.exports = config;
