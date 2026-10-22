import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDemo } from '../../core/application/demo-session';
import { routes } from '../../core/application/routes';
import { getEpisodeAccess } from '../../core/domain/access/episode-access';
import { type Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { BottomNavigation } from '../../ui/bottom-navigation';
import { Button, DemoBalance, Screen } from '../../ui/components';
import { colors } from '../../ui/theme';
import { DemoSettings } from './demo-settings';
import { HomeCategoryChip } from './home-category-chip';
import { HomeHeader } from './home-header';
import { HomeHero } from './home-hero';
import { HomeRails } from './home-rails';

export function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const {
    wallet,
    resetDemo,
    savedSeries,
    toggleSavedSeries,
    catalogue,
    pending,
  } = useDemo();
  const [category, setCategory] = useState('all');
  const demoSeries = catalogue.series;
  const selectedCategory = category;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const episodes = useMemo(
    () =>
      demoSeries.episodes.filter((episode) =>
        episode.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [demoSeries.episodes, query],
  );
  const categoryAvailable =
    catalogue.categories.find((entry) => entry.id === selectedCategory)
      ?.available === true;
  const emptyMessage = categoryAvailable ? t('noMatches') : t('noCategory');
  const showDetails = useCallback(
    () => router.push(routes.series(demoSeries.id)),
    [router, demoSeries.id],
  );
  const openEpisode = useCallback(
    (episode: Episode) => {
      const access = getEpisodeAccess(episode, wallet.entitlements);
      router.push(
        access === 'locked'
          ? routes.unlock(episode.id)
          : routes.player(episode.id),
      );
    },
    [router, wallet.entitlements],
  );

  const goHome = useCallback(() => router.dismissTo(routes.home), [router]);
  const footer = useMemo(() => <BottomNavigation onHome={goHome} />, [goHome]);
  const toggleSearch = useCallback(() => {
    setSearching((value) => !value);
    setQuery('');
  }, [setSearching, setQuery]);
  const header = useMemo(
    () => <HomeHeader searching={searching} onSearch={toggleSearch} />,
    [searching, toggleSearch],
  );
  return (
    <Screen fullBleed header={header} footer={footer}>
      {searching && (
        <TextInput
          accessibilityLabel={t('searchChapters')}
          placeholder={t('searchChapters')}
          placeholderTextColor={colors.tertiary}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
      )}
      <HomeHero
        series={demoSeries}
        saved={savedSeries}
        onSave={toggleSavedSeries}
        onWatch={showDetails}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {catalogue.categories.map(({ id, title: name }) => (
          <HomeCategoryChip
            key={id}
            id={id}
            title={name}
            selected={selectedCategory === id}
            onSelect={setCategory}
          />
        ))}
      </ScrollView>
      {categoryAvailable && episodes.length > 0 ? (
        <HomeRails
          rails={catalogue.rails}
          episodes={episodes}
          wallet={wallet}
          onEpisode={openEpisode}
          onSeeAll={showDetails}
        />
      ) : (
        <Text style={styles.empty}>{emptyMessage}</Text>
      )}

      <View style={styles.demo}>
        <DemoBalance coins={wallet.balanceCoins} style={styles.balance} />
        <Text style={styles.disclaimer}>{t('demoDisclaimer')}</Text>
        <DemoSettings />
        <Button
          label={t('resetDemo')}
          icon="reset"
          secondary
          disabled={pending}
          onPress={resetDemo}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
  },
  filters: { paddingHorizontal: 16, gap: 8, paddingTop: 10 },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
  },
  demo: { paddingHorizontal: 20, paddingTop: 64, gap: 12 },
  balance: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  disclaimer: { color: colors.tertiary, fontSize: 10, textAlign: 'center' },
});
