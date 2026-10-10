const defaultConfig = require('./app.json').expo;
const palette = require('./constants/color-tokens.json');

module.exports = ({ config: base = defaultConfig } = {}) => ({
  ...base,
  backgroundColor: palette.light.background,
  userInterfaceStyle: 'automatic',
  android: { ...base.android, adaptiveIcon: { ...base.android.adaptiveIcon, backgroundColor: palette.light.primaryContainer } },
  plugins: base.plugins.map((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    ? [plugin[0], { ...plugin[1], backgroundColor: palette.light.background, dark: { ...plugin[1].dark, backgroundColor: palette.dark.background } }]
    : plugin).concat('expo-system-ui', './plugins/with-system-theme'),
});
