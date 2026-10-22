import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Button } from '../../ui/button';
import { shadows } from '../../ui/theme';
export function SeriesPlayButton({
  episode,
  onPlay,
}: Readonly<{ episode: Episode; onPlay: (episode: Episode) => void }>) {
  const { t, number } = useI18n();
  const play = useCallback(() => onPlay(episode), [onPlay, episode]);
  return (
    <Button
      label={t('playShort', { number: number(episode.number) })}
      icon="play"
      onPress={play}
      style={styles.play}
    />
  );
}
const styles = StyleSheet.create({
  play: { flex: 1, boxShadow: shadows.primaryCta },
});
