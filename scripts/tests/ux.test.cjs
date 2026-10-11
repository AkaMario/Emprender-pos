/* global __dirname, setImmediate */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../..');

// Render the real components. Stub device primitives only; capture their props
// so dismissal and accessible semantics can be checked without a simulator.
function fixture(overrides = {}) {
  const nodes = []; const cache = new Map();
  const primitive = (type) => (props) => { nodes.push({ type, ...props }); return React.createElement('div', null, props.children); };
  const native = {
    View: primitive('View'), Text: primitive('Text'), TextInput: primitive('TextInput'), Pressable: primitive('Pressable'),
    ScrollView: primitive('ScrollView'), KeyboardAvoidingView: primitive('KeyboardAvoidingView'), Modal: primitive('Modal'), ActivityIndicator: primitive('ActivityIndicator'),
    Platform: { OS: 'android' }, AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: () => ({ remove() {} }), setAccessibilityFocus() {} }, findNodeHandle: () => null,
    StyleSheet: { flatten: (style) => Array.isArray(style) ? Object.assign({}, ...style.map((item) => native.StyleSheet.flatten(item))) : style },
  };
  const mocks = { 'react-native': native, 'react-native-safe-area-context': { SafeAreaView: primitive('SafeAreaView') }, '@/hooks/use-color-scheme': { useColorScheme: () => 'light' }, '@expo/vector-icons/Ionicons': primitive('Icon'), ...overrides };
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: file }).outputText;
    const requireMock = (name) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(file), name);
        if (base.endsWith('.json')) return require(base);
        const suffix = fs.existsSync(base + '.tsx') ? '.tsx' : '.ts'; return load(base + suffix);
      }
      return require(name);
    };
    new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
    return module.exports;
  }
  return { load, nodes, render: (component, props) => { nodes.length = 0; renderToStaticMarkup(React.createElement(component, props)); } };
}

test('focused fields scroll above the keyboard with a margin in nested and resized viewports', () => {
  const { focusedInputScrollOffset: scrollOffset } = fixture().load('components/ui/keyboard-aware-scroll.tsx');
  // Navbar occupies the first 100 px; the keyboard begins at 500 px.
  assert.equal(scrollOffset(0, 470, 48, 100, 500), 50);
  // Already scrolled forms preserve their position when the field is visible.
  assert.equal(scrollOffset(180, 300, 48, 100, 500), 180);
  // A resized dialog can end above the keyboard and must use its own bottom.
  assert.equal(scrollOffset(100, 400, 48, 140, 430), 150);
  // Switching to an earlier field scrolls back up, without a negative offset.
  assert.equal(scrollOffset(180, 110, 48, 100, 500), 158);
  assert.equal(scrollOffset(0, 110, 48, 100, 500), 0);
  // Long multiline inputs keep the beginning of the field in the visible area.
  assert.equal(scrollOffset(0, 400, 600, 100, 500), 268);
});

test('discardable dialog closes through X, backdrop and Android back; content does not dismiss', () => {
  const f = fixture(); const { Dialog } = f.load('components/ui/dialog.tsx'); let closes = 0;
  f.render(Dialog, { visible: true, title: 'Categoría', onClose: () => closes++, children: React.createElement('span', null, 'Contenido') });
  const controls = f.nodes.filter((node) => node.type === 'Pressable'); assert.equal(controls.length, 2);
  for (const node of controls) { assert.equal(node.accessibilityRole, 'button'); assert.equal(node.accessibilityLabel, 'Cerrar diálogo'); node.onPress(); }
  f.nodes.find((node) => node.type === 'Modal').onRequestClose(); assert.equal(closes, 3);
  const body = f.nodes.find((node) => node.accessibilityViewIsModal); assert.equal(body.onPress, undefined); assert.equal(typeof body.onAccessibilityEscape, 'function');
});

test('busy and dirty dialogs protect against accidental dismissal', () => {
  for (const props of [{ busy: true }, { dirty: true }]) {
    const f = fixture(); const { Dialog } = f.load('components/ui/dialog.tsx'); let closes = 0;
    f.render(Dialog, { visible: true, title: 'Editar', onClose: () => closes++, ...props });
    f.nodes.find((node) => node.type === 'Modal').onRequestClose();
    for (const node of f.nodes.filter((node) => node.type === 'Pressable')) node.onPress();
    assert.equal(closes, 0);
  }
});

test('fields expose their label and error; pending buttons expose disabled and busy states', () => {
  const f = fixture(); const { Field, Button } = f.load('components/business/ui.tsx');
  f.render(Field, { label: 'Precio en COP', value: 'incorrecto', error: 'Ingresa un precio válido.' });
  const input = f.nodes.find((node) => node.type === 'TextInput');
  assert.equal(input.value, 'incorrecto'); assert.equal(input.accessibilityLabel, 'Precio en COP'); assert.equal(input.accessibilityHint, 'Ingresa un precio válido.'); assert.ok(input.style[0].minHeight >= 48);
  assert.ok(f.nodes.some((node) => node.accessibilityRole === 'alert'));
  f.render(Button, { title: 'Guardar', loading: true, onPress() {} });
  const button = f.nodes.find((node) => node.type === 'Pressable'); assert.equal(button.disabled, true); assert.deepEqual(button.accessibilityState, { disabled: true, busy: true }); assert.ok(button.style.minHeight >= 48);
});

test('closing a destructive confirmation cancels; repeated activation executes once', async () => {
  const dialogs = []; const buttons = [];
  const f = fixture({ './dialog': { Dialog: (props) => { dialogs.push(props); return React.createElement('div', null, props.children); } }, '@/components/business/ui': { Button: (props) => { buttons.push(props); return null; } } });
  const { AppAlert, AlertHost } = f.load('components/ui/alerts.tsx'); let deleted = 0; let cancelled = 0;
  const choices = [{ text: 'Cancelar', style: 'cancel', onPress: () => cancelled++ }, { text: 'Eliminar', style: 'destructive', onPress: () => deleted++ }];
  AppAlert.alert('Eliminar', '¿Continuar?', choices); f.render(AlertHost); dialogs.at(-1).onClose(); assert.equal(deleted, 0); assert.equal(cancelled, 1);
  AppAlert.alert('Eliminar', '¿Continuar?', choices); f.render(AlertHost); const confirm = buttons.at(-1); assert.equal(confirm.destructive, true); confirm.onPress(); confirm.onPress();
  await new Promise((resolve) => setImmediate(resolve)); assert.equal(deleted, 1);
  const count = dialogs.length; f.render(AlertHost); assert.equal(dialogs.length, count);
});

test('navigation guard blocks a pending write and resumes the exact action after saving', () => {
  const captured = []; const dispatched = [];
  const f = fixture({ 'expo-router': { useNavigation: () => ({ dispatch: (action) => dispatched.push(action) }) }, 'expo-router/react-navigation': { usePreventRemove: (enabled, callback) => captured.push({ enabled, callback }) } });
  const { useUnsavedChanges } = f.load('hooks/use-unsaved-changes.tsx');
  function Screen(props) { return useUnsavedChanges(props.dirty, props.busy, props.isSaved); }
  const action = { type: 'GO_BACK', source: 'offering' };
  f.render(Screen, { dirty: true, busy: true }); assert.equal(captured.at(-1).enabled, true); captured.at(-1).callback({ data: { action } }); assert.equal(dispatched.length, 0);
  f.render(Screen, { dirty: true, busy: true, isSaved: () => true }); captured.at(-1).callback({ data: { action } }); assert.equal(dispatched[0], action);
});

test('shared light and dark text palettes meet AA normal-text contrast', () => {
  const { palette } = fixture().load('constants/design.ts');
  function luminance(hex) {
    const values = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  }
  for (const [mode, colors] of Object.entries(palette)) {
    for (const [foreground, background] of [['text', 'surface'], ['muted', 'background'], ['error', 'surface'], ['onPrimary', 'primary']]) {
      const levels = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
      const ratio = (levels[0] + 0.05) / (levels[1] + 0.05);
      assert.ok(ratio >= 4.5, `${mode}: ${foreground}/${background} = ${ratio.toFixed(2)}`);
    }
  }
});

test('all themed text, semantic badges, pressed buttons and essential controls retain contrast', () => {
  const { palette } = fixture().load('constants/design.ts');
  const luminance = (hex) => {
    const [r, g, b] = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  const contrast = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); };
  const pairs = [];
  for (const foreground of ['text', 'muted', 'link', 'error', 'success', 'warning']) {
    for (const background of ['background', 'surface', 'surfaceElevated']) pairs.push([foreground, background, 4.5]);
  }
  pairs.push(['text', 'primaryContainer', 4.5], ['muted', 'primaryContainer', 4.5], ['primary', 'primaryContainer', 3], ['chart4', 'primaryContainer', 3]);
  pairs.push(['onPrimary', 'primary', 4.5], ['onPrimary', 'primaryPressed', 4.5], ['onError', 'error', 4.5], ['link', 'primaryContainer', 4.5], ['error', 'errorContainer', 4.5], ['success', 'successContainer', 4.5], ['warning', 'warningContainer', 4.5]);
  for (const foreground of ['border', 'icon', 'primary', 'chart1', 'chart2', 'chart3', 'chart4']) {
    for (const background of ['background', 'surface', 'surfaceElevated']) pairs.push([foreground, background, 3]);
  }
  assert.deepEqual(Object.keys(palette.light), Object.keys(palette.dark));
  for (const [mode, colors] of Object.entries(palette)) {
    for (const [foreground, background, minimum] of pairs) {
      const ratio = contrast(colors[foreground], colors[background]);
      assert.ok(ratio >= minimum, `${mode}: ${foreground}/${background} = ${ratio.toFixed(3)}, expected ${minimum}`);
    }
  }
});

test('native controls render the current system theme after a change and a remount', () => {
  let mode = 'light';
  const f = fixture({ '@/hooks/use-color-scheme': { useColorScheme: () => mode } });
  const { palette } = f.load('constants/design.ts'); const { Button, Field, Loading } = f.load('components/business/ui.tsx'); const { Dialog } = f.load('components/ui/dialog.tsx');
  for (const nextMode of ['light', 'dark', 'light', 'dark']) {
    mode = nextMode; const c = palette[mode];
    f.render(Button, { title: 'Guardar', onPress() {} });
    const button = f.nodes.find((node) => node.type === 'Pressable');
    assert.equal(button.style.backgroundColor, c.primary);
    assert.equal(typeof button.onPressIn, 'function');
    assert.equal(typeof button.onPressOut, 'function');
    assert.equal(f.nodes.find((node) => node.type === 'Text').style.color, c.onPrimary);
    f.render(Field, { label: 'Cliente', value: '' });
    const field = f.nodes.find((node) => node.type === 'TextInput'); assert.equal(field.style[0].backgroundColor, c.surface); assert.equal(field.placeholderTextColor, c.muted);
    f.render(Loading); assert.equal(f.nodes.find((node) => node.type === 'ActivityIndicator').color, c.primary);
    f.render(Dialog, { visible: true, title: 'Guardar', onClose() {} }); assert.equal(f.nodes.find((node) => node.accessibilityViewIsModal).style.backgroundColor, c.surface);
  }
});

test('Tailwind emits semantic colors and automatic CSS themes from the shared palette', async () => {
  const postcss = require('postcss'); const tailwind = require('tailwindcss');
  const config = require(path.join(root, 'tailwind.config.js')); const colors = require(path.join(root, 'constants/color-tokens.json'));
  const content = Object.keys(colors.light).flatMap((token) => [`bg-${token}`, `text-${token}`, `border-${token}`]).join(' ');
  const result = await postcss([tailwind({ ...config, content: [{ raw: content }] })]).process('@tailwind base; @tailwind utilities;', { from: undefined });
  const css = result.css; assert.match(css, /prefers-color-scheme: dark/); assert.ok(css.includes(`--theme-background: ${colors.dark.background}`)); assert.ok(css.includes(`--theme-background: ${colors.light.background}`));
  for (const token of Object.keys(colors.light)) {
    assert.ok(css.includes(`.bg-${token}`), `Missing utility bg-${token}`); assert.ok(css.includes(`--color-${token}`), `Missing channel variable for ${token}`);
  }
  assert.match(css, /\.text-onPrimary/); assert.match(css, /\.bg-primaryContainer/);
});

test('native config derives splash, dark window background and system bar appearance from tokens', () => {
  const colors = require(path.join(root, 'constants/color-tokens.json'));
  const config = require(path.join(root, 'app.config.js'))();
  const { setSystemThemeStyles, setNightBackground, setThemeColors } = require(path.join(root, 'plugins/with-system-theme.js'));
  assert.equal(config.userInterfaceStyle, 'automatic'); assert.equal(config.backgroundColor, colors.light.background);
  const splash = config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')[1];
  assert.equal(splash.backgroundColor, colors.light.background); assert.equal(splash.dark.backgroundColor, colors.dark.background);
  const empty = { resources: {} }; const style = setSystemThemeStyles(empty);
  const items = style.resources.style.find((group) => group.$.name === 'AppTheme').item;
  for (const name of ['android:windowLightStatusBar', 'android:windowLightNavigationBar']) assert.equal(items.find((item) => item.$.name === name)._, '?attr/isLightTheme');
  const night = setNightBackground({ resources: {} }); assert.equal(night.resources.color.find((item) => item.$.name === 'activityBackground')._, colors.dark.background);
  for (const mode of ['light', 'dark']) {
    const resources = setThemeColors({ resources: {} }, mode).resources.color;
    for (const name of ['colorPrimary', 'colorAccent']) assert.equal(resources.find((item) => item.$.name === name)._, colors[mode].primary);
  }
});

test('application views use theme tokens rather than literal colors or legacy color utilities', () => {
  const files = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? files(path.join(directory, item.name)) : item.name.endsWith('.tsx') ? [path.join(directory, item.name)] : []);
  for (const file of [...files(path.join(root, 'app')), ...files(path.join(root, 'components'))]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/, `${file} contains a literal color`);
    assert.doesNotMatch(source, /\b(?:bg|text|border)-(?:slate|gray|orange|blue|red|green|emerald|amber)(?:-\d+)\b/, `${file} contains a legacy color utility`);
    assert.doesNotMatch(source, /color=["'](?:white|black)["']/, `${file} contains a fixed icon color`);
  }
});


test('semantic status containers resolve without appending alpha to CSS variables', () => {
  for (const OS of ['ios', 'web']) {
    const f = fixture({ 'react-native': { Platform: { OS } } });
    const { resolveDesignColors, colorContainer } = f.load('constants/design.ts');
    for (const mode of ['light', 'dark']) {
      const c = resolveDesignColors(mode);
      for (const status of ['error', 'success', 'warning', 'primary']) assert.equal(colorContainer(c, c[status]), c[status + 'Container']);
      assert.equal(colorContainer(c, c.text), c.surfaceElevated);
    }
  }
});

test('all button variants keep label, icon and spinner colors aligned in both themes and states', () => {
  for (const mode of ['light', 'dark']) {
    const f = fixture({ '@/hooks/use-color-scheme': { useColorScheme: () => mode } });
    const { Button } = f.load('components/ui/button.tsx');
    const { palette } = f.load('constants/design.ts');
    const { buttonColors } = f.load('constants/button-styles.ts');
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'destructive']) {
      for (const state of [{}, { disabled: true }, { loading: true }, { selected: true }]) {
        let iconColor;
        f.render(Button, { title: 'Acción', variant, onPress() {}, ...state, icon: (color) => { iconColor = color; return null; } });
        const control = f.nodes.find((node) => node.type === 'Pressable');
        const label = f.nodes.find((node) => node.type === 'Text');
        const colors = buttonColors(palette[mode], variant, state);
        assert.equal(label.style.color, colors.foreground);
        assert.equal(control.disabled, Boolean(state.disabled || state.loading));
        assert.equal(control.accessibilityState.busy, Boolean(state.loading));
        // A concrete style survives NativeWind interop; a callback can be dropped,
        // leaving white primary labels over the page background on Android.
        assert.equal(typeof control.style, 'object');
        assert.equal(control.style.backgroundColor, colors.background);
        assert.equal(control.style.opacity, 1);
        assert.equal(control.style.borderRadius, 0);
        if (['primary', 'secondary', 'destructive'].includes(variant)) assert.notEqual(control.style.backgroundColor, 'transparent');
        if (variant === 'secondary') assert.equal(control.style.borderWidth, 1);
        if (state.loading) assert.equal(f.nodes.find((node) => node.type === 'ActivityIndicator').color, label.style.color);
        else assert.equal(iconColor, label.style.color);
        if (state.selected) assert.equal(control.accessibilityState.selected, true);
      }
    }
  }
});

test('legacy action controls pass concrete styles to NativeWind and retain inline backgrounds', () => {
  const f = fixture(); const { ActionPressable } = f.load('components/ui/action-pressable.tsx');
  const { palette } = f.load('constants/design.ts');
  f.render(ActionPressable, { className: 'bg-surface', disabled: true, style: () => ({ backgroundColor: palette.light.primary }) });
  const control = f.nodes.find((node) => node.type === 'Pressable');
  assert.ok(Array.isArray(control.style));
  assert.equal(control.style[1].backgroundColor, palette.light.primary);
  assert.ok(control.style.every((entry) => typeof entry !== 'function'));
  assert.equal(control.style[0].opacity, 0.5);
  assert.ok(control.style[0].minHeight >= 48);
});

test('report charts fit narrow screens without button-sized columns or fixed empty plots', () => {
  const f = fixture({ '@/database/pos-database': { formatCurrency: (value) => `$ ${value}` } });
  const { WeeklySalesChart, CategoryBreakdown, HourlyOrdersChart } = f.load('components/reports/report-charts.tsx');
  const data = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day, index) => ({ day, total: index === 6 ? 10000 : 0, isToday: false }));
  f.render(WeeklySalesChart, { data });
  assert.equal(f.nodes.filter((node) => node.type === 'Pressable').length, 0);
  const fills = f.nodes.filter((node) => typeof node.style?.width === 'string' && node.style.width.endsWith('%'));
  assert.deepEqual(fills.map((node) => node.style.width), ['0%', '0%', '0%', '0%', '0%', '0%', '100%']);
  assert.ok(f.nodes.filter((node) => node.type === 'View').every((node) => !node.style?.minWidth && (!node.style?.height || node.style.height === 6 || node.style.height === '100%')));
  for (const [Chart, props] of [[WeeklySalesChart, { data: [] }], [CategoryBreakdown, { data: [] }], [HourlyOrdersChart, { data: [], compareData: [] }]]) {
    f.render(Chart, props);
    assert.equal(f.nodes.filter((node) => node.type === 'View').length, 0);
    assert.ok(f.nodes.some((node) => node.type === 'Text' && String(node.children).startsWith('No hay')));
  }
});

test('hourly report compares matching hours even when the series have different order', () => {
  const f = fixture({ '@/database/pos-database': { formatCurrency: String } });
  const { HourlyOrdersChart } = f.load('components/reports/report-charts.tsx');
  f.render(HourlyOrdersChart, { data: [{ hour: 13, orders: 2 }, { hour: 14, orders: 0 }], compareData: [{ hour: 14, orders: 4 }, { hour: 13, orders: 1 }] });
  const labels = f.nodes.filter((node) => node.type === 'Text').map((node) => React.Children.toArray(node.children).join(''));
  assert.ok(labels.includes('2 órdenes · Comparación: 1'));
  assert.ok(labels.includes('0 órdenes · Comparación: 4'));
  const fills = f.nodes.filter((node) => typeof node.style?.width === 'string' && node.style.width.endsWith('%'));
  assert.deepEqual(fills.map((node) => node.style.width), ['50%', '25%', '0%', '100%']);
});

test('selectors keep concrete backgrounds and readable labels in both themes and all states', () => {
  const luminance = (hex) => {
    const [r, g, b] = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  for (const mode of ['light', 'dark']) for (const selected of [false, true]) for (const disabled of [false, true]) for (const pressed of [false, true]) {
    const f = fixture({ '@/hooks/use-color-scheme': { useColorScheme: () => mode }, react: { ...React, useState: () => [pressed, () => {}] } });
    const { SelectionOption } = f.load('components/ui/selection-option.tsx');
    const { palette } = f.load('constants/design.ts');
    const { buttonColors } = f.load('constants/button-styles.ts');
    f.render(SelectionOption, { label: 'Categoría de prueba', description: 'Descripción de la opción', selected, disabled, onPress() {} });
    const control = f.nodes.find((node) => node.type === 'Pressable');
    const colors = buttonColors(palette[mode], 'secondary', { selected, disabled, pressed });
    assert.equal(typeof control.style, 'object');
    assert.equal(control.style.backgroundColor, colors.background);
    assert.equal(control.style.opacity, undefined);
    assert.equal(control.style.borderWidth, 1);
    assert.equal(control.style.borderRadius, 0);
    assert.deepEqual(control.accessibilityState, { checked: selected, disabled });
    assert.equal(control.disabled, disabled);
    for (const text of f.nodes.filter((node) => node.type === 'Text')) {
      const levels = [luminance(text.style.color), luminance(control.style.backgroundColor)].sort((a, b) => b - a);
      assert.ok((levels[0] + 0.05) / (levels[1] + 0.05) >= 4.5, `${mode}: selected=${selected}, disabled=${disabled}, pressed=${pressed}`);
    }
  }
});

test('business Choices uses the same high-contrast selectors and preserves the selected value', () => {
  const f = fixture();
  const { Choices } = f.load('components/business/ui.tsx');
  let changed;
  f.render(Choices, { label: 'Unidad', value: 'kg', options: [{ value: 'kg', label: 'Kilogramos' }, { value: 'g', label: 'Gramos' }], onChange: (value) => { changed = value; } });
  const controls = f.nodes.filter((node) => node.type === 'Pressable');
  assert.equal(controls.length, 2);
  assert.equal(controls[0].accessibilityState.checked, true);
  assert.equal(controls[1].accessibilityState.checked, false);
  controls[1].onPress();
  assert.equal(changed, 'g');
  assert.ok(controls.every((control) => typeof control.style === 'object'));
});


test('sidebar offers the configuration tutorial and replays it after closing the menu', () => {
  const events = [];
  const f = fixture({
    '@/context/business': { useBusiness: () => ({ profile: { name: 'Mi tienda', model: 'retail' }, definition: { catalog: 'Catálogo', inventory: 'Inventario', operations: 'Movimientos' } }) },
    '@/context/tutorial': { useTutorial: () => ({ start: () => events.push('start') }) },
    'expo-router': { usePathname: () => '/', useRouter: () => ({ navigate: (route) => events.push(route) }) },
  });
  f.render(f.load('components/layout/sidebar.tsx').Sidebar, { isOpen: true, onClose: () => events.push('close') });
  const replay = f.nodes.find((node) => node.accessibilityLabel === 'Tutorial de configuración');
  assert.equal(replay.accessibilityRole, 'button');
  replay.onPress();
  assert.deepEqual(events, ['close', '/(tabs)/settings', 'start']);
});


test('iOS waits until the sidebar modal is dismissed before opening the tutorial', () => {
  const events = [];
  const f = fixture({
    'react-native': { Platform: { OS: 'ios' }, View: (props) => React.createElement('div', null, props.children), Text: (props) => React.createElement('span', null, props.children), ScrollView: (props) => React.createElement('div', null, props.children),
      Modal: (props) => { events.push(props); return React.createElement('div', null, props.children); } },
    '@/components/ui/action-pressable': { ActionPressable: (props) => { events.push(props); return React.createElement('button', null, props.children); } },
    '@/constants/design': { useDesignColors: () => ({}) },
    '@/context/business': { useBusiness: () => ({ profile: { name: 'Tienda', model: 'retail' } }) },
    '@/context/tutorial': { useTutorial: () => ({ start: () => events.push('start') }) },
    'expo-router': { usePathname: () => '/', useRouter: () => ({ navigate: (route) => events.push(route) }) },
  });
  f.render(f.load('components/layout/sidebar.tsx').Sidebar, { isOpen: true, onClose: () => events.push('close') });
  const replay = events.find((node) => node.accessibilityLabel === 'Tutorial de configuración');
  const modal = events.find((node) => typeof node.onDismiss === 'function');
  events.length = 0;
  replay.onPress();
  assert.deepEqual(events, ['close']);
  modal.onDismiss();
  assert.deepEqual(events, ['close', '/(tabs)/settings', 'start']);
  modal.onDismiss();
  assert.equal(events.filter((event) => event === 'start').length, 1);
});
