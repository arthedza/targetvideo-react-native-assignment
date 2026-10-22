import { Platform, StyleSheet } from 'react-native';

export const colors = {
  background: '#000000',
  onAccent: '#044449',
  surface: '#18172B',
  elevated: '#1E1D35',
  panel: '#1A192F',
  outline: '#322F56',
  primary: '#64EDF7',
  secondary: '#CB64F7',
  text: '#FFFFFF',
  muted: '#C0BEDA',
  tertiary: '#9CA3AF',
  gold: '#FACC15',
  scrim: 'rgba(0, 0, 0, 0.76)',
} as const;

export const shadows = { primaryCta: '0 4px 28px #64EDF71A' } as const;

export const typography = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  section: { color: colors.text, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
