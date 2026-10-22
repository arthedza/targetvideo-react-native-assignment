import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { getEpisodeAccess } from '../../core/domain/access/episode-access';
import { type Episode, getRouteId } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { BottomNavigation } from '../../ui/bottom-navigation';
import { Button, DemoBalance, Screen } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { colors, typography } from '../../ui/theme';
import { CliffhangerShortcut } from './cliffhanger-shortcut';
import { EpisodeRow } from './episode-row';
import { SeriesExtras } from './series-extras';
import { SeriesHero } from './series-hero';

export function SeriesScreen() {
  const { t } = useI18n();
  const { seriesId } = useLocalSearchParams();
  const router = useRouter();
  const { wallet, savedSeries, toggleSavedSeries, catalogue } = useDemo();
  const demoSeries = catalogue.series;
  const back = useCallback(() => router.dismissTo(routes.home), [router]);
  const play = useCallback(
    (episode: Episode) => router.push(routes.player(episode.id)),
    [router],
  );
  const select = useCallback(
    (episode: Episode) => {
      const locked =
        getEpisodeAccess(episode, wallet.entitlements) === 'locked';
      router.push(
        locked ? routes.unlock(episode.id) : routes.player(episode.id),
      );
    },
    [router, wallet.entitlements],
  );

  const footer = useMemo(() => <BottomNavigation onHome={back} />, [back]);
  if (getRouteId(seriesId) !== demoSeries.id) {
    return (
      <Screen>
        <Text accessibilityRole="header" style={typography.title}>
          {t('seriesNotFound')}
        </Text>
        <Text style={typography.body}>{t('storyUnavailable')}</Text>
        <Button label={t('backHome')} onPress={back} />
      </Screen>
    );
  }

  return (
    <Screen fullBleed footer={footer}>
      <SeriesHero
        series={demoSeries}
        saved={savedSeries}
        onSave={toggleSavedSeries}
        onBack={back}
        onPlay={play}
      />
      <View style={styles.body}>
        <DisplayText accessibilityRole="header" style={styles.sectionTitle}>
          {t('synopsis')}
        </DisplayText>
        <Text style={styles.synopsis}>{demoSeries.synopsis}</Text>
        <SeriesExtras series={demoSeries} />
        <View style={styles.episodeHeader}>
          <DisplayText accessibilityRole="header">
            {t('episodeOther')}
          </DisplayText>
          <Text style={styles.count}>{demoSeries.episodes.length}</Text>
          <DemoBalance coins={wallet.balanceCoins} style={styles.balance} />
        </View>
        {demoSeries.episodes.map((episode) => {
          const access = getEpisodeAccess(episode, wallet.entitlements);
          return (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              access={access}
              onSelect={select}
            />
          );
        })}
        {demoSeries.episodes
          .filter((episode) => episode.isFree)
          .slice(-1)
          .map((episode) => (
            <CliffhangerShortcut
              key={episode.id}
              episode={episode}
              onPlay={play}
            />
          ))}
        <Text style={styles.disclaimer}>{t('seriesDisclaimer')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { lineHeight: 26 },
  synopsis: {
    marginTop: 12,
    color: colors.tertiary,
    fontSize: 14,
    lineHeight: 23,
  },
  episodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 16,
  },
  count: {
    backgroundColor: colors.surface,
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  balance: { marginLeft: 'auto', fontSize: 10, color: colors.tertiary },
  disclaimer: {
    color: colors.tertiary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
