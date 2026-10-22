import { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { colors } from '../../ui/theme';
export function CliffhangerShortcut({
  episode,
  onPlay,
}: Readonly<{ episode: Episode; onPlay: (episode: Episode) => void }>) {
  const { t } = useI18n();
  const play = useCallback(() => onPlay(episode), [onPlay, episode]);
  const label = t('cliffhangerShortcut', { number: episode.number });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={play}
      style={styles.demo}
    >
      <Text style={styles.demoLabel}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  demo: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  demoLabel: { color: colors.primary, fontSize: 12 },
});
