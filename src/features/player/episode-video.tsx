import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Button } from '../../ui/components';
import { colors, typography } from '../../ui/theme';
import { EpisodeProgress } from './episode-progress';

const assets = {
  demo: require('../../../assets/demo.mp4'),
  garden: require('../../../assets/garden.mp4'),
  flight: require('../../../assets/flight.mp4'),
};
type Props = PropsWithChildren<
  Readonly<{
    asset: Episode['videoAsset'];
    active?: boolean;
    startTime?: number;
    onProgress?: (seconds: number) => void;
    onEnded: () => void;
    onRetry: () => void;
  }>
>;

export function EpisodeVideo({
  asset,
  active = true,
  startTime = 0,
  onProgress,
  onEnded,
  onRetry,
  children,
}: Props) {
  const { t } = useI18n();
  const alive = useRef(true);
  const ended = useRef(false);
  const foreground = useRef(AppState.currentState === 'active');
  const interrupted = useRef(AppState.currentState !== 'active');
  const [inForeground, setInForeground] = useState(
    AppState.currentState === 'active',
  );
  const canPlay = active && inForeground;
  const position = useRef(startTime);
  const progressCallback = useRef(onProgress);
  const restored = useRef(false);
  useEffect(() => {
    progressCallback.current = onProgress;
  }, [onProgress]);
  const player = useVideoPlayer(assets[asset], (created) => {
    created.loop = false;
    created.timeUpdateEventInterval = 0.25;
    if (active && foreground.current) created.play();
  });
  const checkpoint = useCallback(() => {
    const clock = player.currentTime;
    if (Number.isFinite(clock) && clock >= 0) position.current = clock;
    progressCallback.current?.(position.current);
  }, [player]);
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const source = useEvent(player, 'sourceLoad');
  const duration = source?.duration ?? player.duration;
  const durationKnown = Number.isFinite(duration) && duration > 0;

  useEffect(() => {
    if (restored.current || !durationKnown) return;
    restored.current = true;
    if (startTime > 0 && startTime < duration) {
      player.seekBy(startTime - player.currentTime);
      position.current = startTime;
    } else position.current = 0;
  }, [player, duration, durationKnown, startTime]);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (Number.isFinite(currentTime) && currentTime >= 0)
      position.current = currentTime;
  });

  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (!alive.current) return;
      foreground.current = state === 'active';
      setInForeground(foreground.current);
      if (!foreground.current) {
        interrupted.current = true;
        player.pause();
        checkpoint();
      }
    });
    return () => {
      alive.current = false;
      subscription.remove();
      progressCallback.current?.(ended.current ? 0 : position.current);
    };
  }, [player, checkpoint]);
  useEffect(() => {
    if (!active || status === 'error') {
      interrupted.current = true;
      player.pause();
      checkpoint();
    }
  }, [active, status, player, checkpoint]);
  useEventListener(player, 'playToEnd', () => {
    if (
      !alive.current ||
      !active ||
      !foreground.current ||
      interrupted.current ||
      ended.current ||
      player.status === 'error'
    )
      return;
    ended.current = true;
    player.pause();
    progressCallback.current?.(0);
    onEnded();
  });

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      interrupted.current = true;
      player.pause();
      checkpoint();
    } else {
      interrupted.current = false;
      player.play();
    }
  }, [isPlaying, player, checkpoint]);
  const jumpToEnding = useCallback(() => {
    interrupted.current = false;
    player.seekBy(Math.max(0, duration - 2 - player.currentTime));
    player.play();
  }, [player, duration]);
  if (status === 'error') {
    return (
      <View style={styles.error}>
        <Text accessibilityRole="alert" style={typography.body}>
          {t('videoError')}
        </Text>
        <Button label={t('retryVideo')} onPress={onRetry} />
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        style={styles.video}
      />
      <LinearGradient
        colors={videoGradient}
        locations={videoStops}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.controls}>
        {children}
        {status !== 'readyToPlay' && (
          <Text style={typography.caption}>{t('loadingVideo')}</Text>
        )}
        <EpisodeProgress
          player={player}
          duration={duration}
          durationKnown={durationKnown}
        />
        <View style={styles.actions}>
          <Button
            label={isPlaying ? t('pause') : t('play')}
            icon={isPlaying ? 'pause' : 'play'}
            disabled={!canPlay || status !== 'readyToPlay'}
            onPress={togglePlayback}
            style={styles.play}
          />
          <Button
            label={t('lastTwo')}
            accessibilityLabel={t('jumpLastTwo')}
            icon="chevron"
            secondary
            disabled={!canPlay || status !== 'readyToPlay' || !durationKnown}
            onPress={jumpToEnding}
            style={styles.jump}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  video: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  controls: { position: 'absolute', bottom: 44, left: 20, right: 20, gap: 12 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  play: { minWidth: 124 },
  jump: {
    paddingHorizontal: 12,
    backgroundColor: '#00000066',
    borderColor: '#FFFFFF33',
  },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: 36, gap: 20 },
});

const videoGradient = ['#00000080', '#00000000', '#000000F2'] as const;
const videoStops = [0, 0.4, 1] as const;
