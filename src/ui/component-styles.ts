import { StyleSheet } from 'react-native';

import { colors } from './theme';

export const componentStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  insetCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingBottom: 32,
  },
  fixed: { flex: 1 },
  image: { width: '100%', height: '100%' },
  inset: { padding: 20, gap: 20 },
  button: {
    backgroundColor: colors.primary,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1,
  },
  secondaryText: { color: colors.text },
  disabled: { opacity: 0.45 },
  fallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
