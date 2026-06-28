const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch shared packages so HMR works across workspace boundaries.
// NOTE: Do NOT override config.projectRoot or config.resolver.nodeModulesPaths.
// Expo's default config correctly handles pnpm workspace symlink resolution
// via the workspace root (getMetroServerRoot). Overriding these breaks
// pnpm's symlink chain and prevents module resolution.
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(workspaceRoot, 'packages'),
];

module.exports = config;
