import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';

import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { getEpisode, getRouteId } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Button, Screen } from '../../ui/components';
import { typography } from '../../ui/theme';
import { UnlockOffer } from './unlock-offer';

export function UnlockScreen() {
  const { t } = useI18n();
  const { episodeId } = useLocalSearchParams();
  const { catalogue } = useDemo();
  const episode = getEpisode(getRouteId(episodeId), catalogue.series);
  const router = useRouter();
  const backToEpisodes = useCallback(
    () => router.replace(routes.series(catalogue.series.id)),
    [router, catalogue.series.id],
  );
  if (!episode)
    return (
      <Screen>
        <Text accessibilityRole="header" style={typography.title}>
          {t('episodeNotFound')}
        </Text>
        <Button label={t('backEpisodes')} onPress={backToEpisodes} />
      </Screen>
    );
  return <UnlockOffer episode={episode} />;
}
