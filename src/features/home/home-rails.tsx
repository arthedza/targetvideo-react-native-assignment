import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DemoWallet } from '../../core/domain/access/demo-wallet';
import { getEpisodeAccess } from '../../core/domain/access/episode-access';
import type { Catalogue } from '../../core/domain/api-schemas';
import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { DisplayText } from '../../ui/display-text';
import { colors } from '../../ui/theme';
import { HomeEpisodeCard } from './home-episode-card';

type Props = Readonly<{
  rails: Catalogue['rails'];
  episodes: readonly Episode[];
  wallet: DemoWallet;
  onEpisode: (episode: Episode) => void;
  onSeeAll: () => void;
}>;

export function HomeRails({
  rails,
  episodes,
  wallet,
  onEpisode,
  onSeeAll,
}: Props) {
  const { t } = useI18n();
  return (
    <View>
      {rails.map((rail) => {
        const selection = rail.numbers.flatMap((number) =>
          episodes.filter((episode) => episode.number === number),
        );
        if (selection.length === 0) return null;
        return (
          <View key={rail.title} style={styles.section}>
            {rail.category !== '' && (
              <View style={styles.category}>
                <LinearGradient
                  colors={categoryGradient}
                  style={styles.square}
                />
                <DisplayText
                  accessibilityRole="header"
                  style={styles.categoryText}
                >
                  {rail.category}
                </DisplayText>
              </View>
            )}
            <View style={styles.railHeader}>
              <DisplayText accessibilityRole="header" style={styles.heading}>
                {rail.title}
              </DisplayText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('seeAllEpisodes', { title: rail.title })}
                onPress={onSeeAll}
                style={styles.seeAll}
              >
                <Text style={styles.seeAllText}>{t('seeAll')}</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cards}
            >
              {selection.map((episode, index) => (
                <HomeEpisodeCard
                  key={episode.id}
                  episode={episode}
                  access={getEpisodeAccess(episode, wallet.entitlements)}
                  poster={rail.poster + index}
                  onEpisode={onEpisode}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  category: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  square: { width: 24, height: 24 },
  categoryText: { fontSize: 24, lineHeight: 32 },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    minHeight: 34,
  },
  heading: { fontSize: 20, lineHeight: 26 },
  seeAll: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  seeAllText: { color: colors.primary, fontSize: 12 },
  cards: { gap: 16, paddingHorizontal: 8 },
});

const categoryGradient = [colors.primary, colors.secondary] as const;
