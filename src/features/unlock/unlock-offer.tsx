import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiMessageKeys } from '../../core/application/api-errors';
import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { useUnlockOffer } from '../../core/application/use-demo';
import { getEpisodeAccess } from '../../core/domain/access/episode-access';
import type { Episode } from '../../core/domain/catalogue';
import { ApiError } from '../../core/infrastructure/mock/transport';
import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Button, Cover, Screen } from '../../ui/components';
import { colors, typography } from '../../ui/theme';
import { PaywallCard } from './paywall-card';

const messages = {
  'invalid-balance': 'invalidBalance',
  'invalid-price': 'invalidPrice',
  'not-for-sale': 'notForSale',
  'insufficient-funds': 'insufficientFunds',
} as const;

export function UnlockOffer({ episode }: Readonly<{ episode: Episode }>) {
  const { t } = useI18n();
  const router = useRouter();
  const {
    wallet,
    confirmUnlock,
    catalogue,
    pending,
    error,
    clearError,
    refreshDemo,
  } = useDemo();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const canPlay = getEpisodeAccess(episode, wallet.entitlements) !== 'locked';
  const offer = useUnlockOffer(episode.id, !canPlay);
  const quote = offer.data?.quote;
  const failure = error ?? offer.error;
  let notice: string | undefined;
  if (failure)
    notice = t(
      apiMessageKeys[failure instanceof ApiError ? failure.code : 'network'],
    );
  else if (quote && !quote.ok) notice = t(messages[quote.reason]);
  useEffect(() => {
    if (canPlay) {
      if (router.canDismiss()) router.dismissAll();
      router.dismissTo(routes.home);
      router.push(routes.series(catalogue.series.id));
      router.push(routes.player(episode.id));
    }
  }, [canPlay, episode.id, catalogue.series.id, router]);
  const stageStyle = useMemo(
    () =>
      [
        styles.stage,
        {
          minHeight: height - insets.bottom,
          paddingTop: Math.max(insets.top, 58),
        },
      ] as const,
    [height, insets.bottom, insets.top],
  );
  const confirm = useCallback(
    () => confirmUnlock(episode.id),
    [confirmUnlock, episode.id],
  );
  const cancel = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(routes.series(catalogue.series.id));
  }, [router, catalogue.series.id]);
  const refresh = useCallback(() => {
    clearError();
    void refreshDemo();
  }, [clearError, refreshDemo]);
  if (canPlay)
    return (
      <Screen>
        <Text style={typography.body}>{t('openingEpisode')}</Text>
      </Screen>
    );
  return (
    <Screen fullBleed contentStyle={styles.scroll}>
      <View style={stageStyle}>
        <Cover source={artwork.paywall} label={t('paywallBackdrop')} />
        <View style={styles.scrim} />
        <PaywallCard
          episode={episode.title}
          price={offer.data ? offer.data.price : episode.unlockPriceCoins}
          balance={offer.data?.balanceCoins ?? wallet.balanceCoins}
          remaining={quote?.ok ? quote.remaining : undefined}
          plans={catalogue.plans}
          notice={notice}
          pending={pending}
          loading={offer.isPending}
          disabled={pending || offer.isPending || !quote?.ok}
          onConfirm={confirm}
          onLater={cancel}
        />
        {failure && (
          <Button
            label={t('refreshOffer')}
            secondary
            disabled={pending}
            onPress={refresh}
          />
        )}
        <Text style={styles.demo}>{t('demoMoney')}</Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  scroll: { paddingBottom: 0 },
  stage: {
    paddingHorizontal: 19,
    paddingBottom: 34,
    alignItems: 'center',
    gap: 8,
  },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#000000EB' },
  demo: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 8 },
});
