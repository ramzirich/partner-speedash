const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// Native build output churns constantly during a Gradle build: CMake creates and
// deletes scratch dirs faster than the watcher can stat them, crashing Metro with
// ENOENT when watchman is absent (the fs.watch fallback). None of it is source.
const config = {
  resolver: {
    blockList: [
      /[/\\]android[/\\]app[/\\]\.cxx[/\\].*/,
      /[/\\]android[/\\][^/\\]+[/\\]build[/\\].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
