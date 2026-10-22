import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { DemoProvider } from '../src/core/application/demo-session';
import { DisplayFontContext } from '../src/ui/display-text';
import { colors } from '../src/ui/theme';

const fonts = { Display: require('../assets/fonts/PlayfairDisplay-Bold.ttf') };

export default function RootLayout() {
  const [loaded] = useFonts(fonts);
  const fontFamily = loaded
    ? 'Display'
    : Platform.select({ ios: 'Georgia', default: 'serif' });
  return (
    <DisplayFontContext.Provider value={fontFamily}>
      <DemoProvider>
        <StatusBar style="light" />
        <Stack screenOptions={screenOptions} />
      </DemoProvider>
    </DisplayFontContext.Provider>
  );
}

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
} as const;
