const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only the source directories within the monorepo — not node_modules.
// Metro resolves workspace packages via nodeModulesPaths; watchFolders is for
// HMR/fast-refresh across workspace boundaries (e.g. editing a shared package).
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages'),
  path.resolve(workspaceRoot, 'apps'),
];

// Resolve node_modules from the project root first, then fall back to the
// monorepo root so workspace:* packages resolve correctly.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
