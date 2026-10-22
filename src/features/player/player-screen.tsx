import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';

import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { getEpisode, getRouteId } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Button, Screen } from '../../ui/components';
import { typography } from '../../ui/theme';
import { PlayerEpisode } from './player-episode';
export function PlayerScreen() {
  const { t } = useI18n();
  const { episodeId } = useLocalSearchParams();
  const router = useRouter();
  const { catalogue } = useDemo();
  const demoSeries = catalogue.series;
  const episode = getEpisode(getRouteId(episodeId), demoSeries);
  const back = useCallback(
    () => router.dismissTo(routes.series(demoSeries.id)),
    [router, demoSeries.id],
  );
  if (!episode)
    return (
      <Screen scrollable={false}>
        <Text accessibilityRole="header" style={typography.title}>
          {t('episodeNotFound')}
        </Text>
        <Button
          label={t('backEpisodes')}
          secondary
          icon="back"
          onPress={back}
        />
      </Screen>
    );

  return <PlayerEpisode episode={episode} onBack={back} />;
}
