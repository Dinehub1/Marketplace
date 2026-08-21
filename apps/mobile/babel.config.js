module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Must be last. Reanimated's worklets are compiled by this plugin; without
    // it every spring silently runs on the JS thread and drops frames under load.
    plugins: ["react-native-worklets/plugin"],
  };
};
