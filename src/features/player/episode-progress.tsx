import { useEvent } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../core/localization/use-i18n';
import { colors } from '../../ui/theme';

export function EpisodeProgress({
  player,
  duration,
  durationKnown,
}: Readonly<{
  player: VideoPlayer;
  duration: number;
  durationKnown: boolean;
}>) {
  const { t } = useI18n();
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    bufferedPosition: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });
  const elapsed =
    durationKnown && Number.isFinite(currentTime)
      ? Math.min(duration, Math.max(0, currentTime))
      : 0;
  const accessibilityValue = useMemo(
    () =>
      durationKnown
        ? { min: 0, max: duration, now: elapsed }
        : { text: t('durationUnavailable') },
    [durationKnown, duration, elapsed, t],
  );
  const progressStyle = useMemo(
    () =>
      [
        styles.progress,
        {
          width: `${durationKnown ? (elapsed / duration) * 100 : 0}%`,
        },
      ] as const,
    [durationKnown, elapsed, duration],
  );
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('episodeProgress')}
      accessibilityValue={accessibilityValue}
    >
      <View style={styles.track}>
        <View style={progressStyle} />
      </View>
      <Text style={styles.time}>
        {t('timeProgress', {
          elapsed: Math.floor(elapsed),
          duration: durationKnown
            ? t('seconds', { value: Math.floor(duration) })
            : '—',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF33',
    overflow: 'hidden',
  },
  progress: { height: 2, backgroundColor: colors.primary },
  time: { color: colors.muted, fontSize: 10, marginTop: 6 },
});
