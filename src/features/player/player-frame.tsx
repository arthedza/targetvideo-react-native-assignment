import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { type Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { BottomNavigation } from '../../ui/bottom-navigation';
import { Cover, DemoBalance, Screen } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { IconButton } from '../../ui/icon-button';
import { SeriesShare } from '../../ui/series-share';
import { colors } from '../../ui/theme';

type Props = PropsWithChildren<{
  episode: Episode;
  backdrop: boolean;
  onBack: () => void;
}>;

export function PlayerFrame({ episode, backdrop, onBack, children }: Props) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wallet, savedSeries, toggleSavedSeries, catalogue } = useDemo();
  const demoSeries = catalogue.series;
  const goHome = useCallback(() => router.dismissTo(routes.home), [router]);
  const footer = useMemo(() => <BottomNavigation onHome={goHome} />, [goHome]);
  const headerStyle = useMemo(
    () => [styles.header, { top: insets.top + 4 }] as const,
    [insets.top],
  );
  return (
    <Screen
      fullBleed
      scrollable={false}
      contentStyle={styles.scroll}
      footer={footer}
    >
      <View style={styles.stage}>
        {backdrop && (
          <>
            <Cover label={t('episodeArtwork')} />
            <LinearGradient
              colors={backdropGradient}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        <View style={StyleSheet.absoluteFill}>{children}</View>
        <View style={headerStyle}>
          <IconButton label={t('backEpisodes')} icon="back" onPress={onBack} />
          <DisplayText accessibilityRole="header" style={styles.episode}>
            {episode.title}
          </DisplayText>
          <DemoBalance coins={wallet.balanceCoins} style={styles.wallet} />
        </View>
        <View style={styles.rail}>
          <View style={styles.railItem}>
            <IconButton
              label={savedSeries ? t('removeSavedSeries') : t('saveSeries')}
              icon="heart"
              active={savedSeries}
              onPress={toggleSavedSeries}
            />
            <Text style={styles.railLabel}>{t('save')}</Text>
          </View>
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('commentsPreview')}
            accessibilityState={previewState}
            style={previewStyle}
          >
            <Icon name="comment" size={24} />
            <Text style={styles.railLabel}>{t('preview')}</Text>
          </View>
          <View style={styles.railItem}>
            <SeriesShare title={demoSeries.title} />
            <Text style={styles.railLabel}>{t('share')}</Text>
          </View>
        </View>
        <View style={styles.credit}>
          <Text style={styles.creditText}>
            Demo footage: Big Buck Bunny · CC BY 3.0
          </Text>
          <Text style={styles.creditText}>
            (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 0 },
  stage: { flex: 1, width: '100%', backgroundColor: colors.background },
  header: {
    position: 'absolute',
    left: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episode: { color: colors.text, fontSize: 16, lineHeight: 22, flex: 1 },
  wallet: {
    color: colors.muted,
    backgroundColor: '#00000080',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 9,
  },
  rail: {
    position: 'absolute',
    right: 12,
    bottom: 188,
    gap: 20,
    width: 44,
    alignItems: 'center',
  },
  railItem: { alignItems: 'center', gap: 4 },
  railLabel: { color: colors.text, fontSize: 10, lineHeight: 14 },
  preview: { opacity: 0.5, minHeight: 48, justifyContent: 'center' },
  credit: { position: 'absolute', bottom: 8, left: 20, right: 20, gap: 2 },
  creditText: { color: colors.muted, fontSize: 8, lineHeight: 11 },
});

const backdropGradient = ['#00000066', '#00000055', '#000000F2'] as const;
const previewState = { disabled: true } as const;
const previewStyle = [styles.railItem, styles.preview] as const;
