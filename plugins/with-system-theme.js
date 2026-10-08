const { AndroidConfig, withAndroidColors, withAndroidColorsNight, withAndroidStyles } = require('expo/config-plugins');
const palette = require('../constants/color-tokens.json');

// Android resolves these theme attributes again when uiMode changes, including
// before JS mounts. Keep system bars transparent for the existing edge-to-edge UI.
function setSystemThemeStyles(styles) {
  for (const name of ['android:windowLightNavigationBar', 'android:windowLightStatusBar']) {
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true, parent: AndroidConfig.Styles.getAppThemeGroup(), name, value: '?attr/isLightTheme',
    });
  }
  return AndroidConfig.Styles.assignStylesValue(styles, {
    add: true, parent: AndroidConfig.Styles.getAppThemeGroup(), name: 'colorAccent', value: '@color/colorAccent',
  });
}
function setThemeColors(colors, mode) {
  const c = palette[mode];
  for (const [name, value] of Object.entries({ activityBackground: c.background, colorPrimary: c.primary, colorAccent: c.primary, colorPrimaryDark: c.background })) {
    colors = AndroidConfig.Colors.assignColorValue(colors, { name, value });
  }
  return colors;
}
function setNightBackground(colors) { return setThemeColors(colors, 'dark'); }
module.exports = function withSystemTheme(config) {
  config = withAndroidStyles(config, (mod) => { mod.modResults = setSystemThemeStyles(mod.modResults); return mod; });
  config = withAndroidColors(config, (mod) => { mod.modResults = setThemeColors(mod.modResults, 'light'); return mod; });
  return withAndroidColorsNight(config, (mod) => { mod.modResults = setNightBackground(mod.modResults); return mod; });
};
module.exports.setSystemThemeStyles = setSystemThemeStyles;
module.exports.setNightBackground = setNightBackground;

module.exports.setThemeColors = setThemeColors;
