import { createContext, useContext, useMemo } from 'react';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { colors } from './theme';

export const DisplayFontContext = createContext(
  Platform.select({ ios: 'Georgia', default: 'serif' }),
);

export function DisplayText({ style, ...props }: TextProps) {
  const fontFamily = useContext(DisplayFontContext);
  const textStyle = useMemo(
    () =>
      [
        styles.text,
        {
          fontFamily,
        },
        style,
      ] as const,
    [fontFamily, style],
  );
  return <Text {...props} style={textStyle} />;
}

const styles = StyleSheet.create({
  text: { color: colors.text, fontSize: 20, lineHeight: 27 },
});
