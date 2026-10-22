import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { getEpisodeAccess } from '../../core/domain/access/episode-access';
import { type Episode, getNextEpisode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Button } from '../../ui/button';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { colors } from '../../ui/theme';
import { ContinuationButton } from './continuation-button';
import { EpisodeVideo } from './episode-video';
import { PlayerFrame } from './player-frame';
import { PlayerIdentity } from './player-identity';
export function PlayerEpisode({
  episode,
  onBack: back,
}: Readonly<{ episode: Episode; onBack: () => void }>) {
  const { t } = useI18n();
  const router = useRouter();
  const focused = useIsFocused();
  const { wallet, progress, saveProgress, catalogue } = useDemo();
  const demoSeries = catalogue.series;
  const [endedId, setEndedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const unlock = useCallback(
    () => router.push(routes.unlock(episode.id)),
    [router, episode.id],
  );
  const checkpoint = useCallback(
    (seconds: number) => saveProgress(episode.id, seconds),
    [episode.id, saveProgress],
  );
  const end = useCallback(() => setEndedId(episode.id), [episode.id]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (getEpisodeAccess(episode, wallet.entitlements) === 'locked')
    return (
      <PlayerFrame episode={episode} backdrop onBack={back}>
        <View style={styles.center}>
          <View style={styles.gate}>
            <Icon name="lock" size={32} color={colors.text} />
            <DisplayText accessibilityRole="header" style={styles.gateTitle}>
              {t('lockedTitle', { episode: episode.title })}
            </DisplayText>
            <Text style={styles.body}>{t('unlockChapter')}</Text>
            <Button
              label={t('unlockTitle', { episode: episode.title })}
              icon="lock"
              onPress={unlock}
            />
          </View>
        </View>
        <View style={styles.identity}>
          <PlayerIdentity episode={episode} series={demoSeries} />
        </View>
      </PlayerFrame>
    );

  const next = getNextEpisode(episode.id, demoSeries);
  const nextLocked =
    next !== undefined &&
    getEpisodeAccess(next, wallet.entitlements) === 'locked';
  const continuationIcon = nextLocked ? 'lock' : 'play';
  const ended = endedId === episode.id;
  return (
    <PlayerFrame episode={episode} backdrop={ended} onBack={back}>
      {ended ? (
        <>
          <View style={styles.center}>
            <View style={styles.gate}>
              <Icon
                name={next ? continuationIcon : 'check'}
                size={32}
                color={colors.primary}
              />
              <DisplayText accessibilityRole="header" style={styles.gateTitle}>
                {next ? t('continued') : t('theEnd')}
              </DisplayText>
              {next ? (
                <>
                  <Text style={styles.body}>
                    {t('nextAwaits', { episode: next.title })}
                  </Text>
                  <ContinuationButton episode={next} locked={nextLocked} />
                </>
              ) : (
                <Text style={styles.body}>{t('storyEnd')}</Text>
              )}
            </View>
          </View>
          <View style={styles.identity}>
            <PlayerIdentity episode={episode} series={demoSeries} />
          </View>
        </>
      ) : (
        <EpisodeVideo
          key={`${episode.id}:${attempt}`}
          asset={episode.videoAsset}
          active={focused}
          startTime={progress[episode.id] ?? 0}
          onProgress={checkpoint}
          onEnded={end}
          onRetry={retry}
        >
          <PlayerIdentity episode={episode} series={demoSeries} />
        </EpisodeVideo>
      )}
    </PlayerFrame>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  gate: {
    width: '100%',
    gap: 16,
    padding: 22,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#07192EEB',
    borderWidth: 1,
    borderColor: '#322F5680',
  },
  gateTitle: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  identity: { position: 'absolute', bottom: 74, left: 20, right: 72 },
});
