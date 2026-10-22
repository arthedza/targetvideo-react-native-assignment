import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Episode, type Series } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Cover } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { IconButton } from '../../ui/icon-button';
import { SeriesShare } from '../../ui/series-share';
import { colors } from '../../ui/theme';
import { SeriesPlayButton } from './series-play-button';

export function SeriesHero({
  series: demoSeries,
  saved,
  onSave,
  onBack,
  onPlay,
}: Readonly<{
  series: Series;
  saved: boolean;
  onSave: () => void;
  onBack: () => void;
  onPlay: (episode: Episode) => void;
}>) {
  const { t, number, compactNumber } = useI18n();
  const insets = useSafeAreaInsets();
  const first = demoSeries.episodes[0];
  const navigationStyle = useMemo(
    () => [styles.navigation, { top: insets.top + 4 }] as const,
    [insets.top],
  );
  return (
    <View style={styles.hero}>
      <Cover />
      <LinearGradient
        colors={heroGradient}
        locations={heroStops}
        style={StyleSheet.absoluteFill}
      />
      <View style={navigationStyle}>
        <IconButton label={t('backHome')} icon="back" onPress={onBack} />
        <View style={styles.headerActions}>
          <IconButton
            label={saved ? t('removeSavedSeries') : t('saveSeries')}
            icon="heart"
            active={saved}
            onPress={onSave}
          />
          <SeriesShare title={demoSeries.title} />
        </View>
      </View>
      <View style={styles.copy}>
        <View style={styles.genres}>
          {demoSeries.genres.map((genre) => (
            <Text key={genre} style={styles.genre}>
              {genre}
            </Text>
          ))}
        </View>
        <DisplayText accessibilityRole="header" style={styles.title}>
          {demoSeries.title}
        </DisplayText>
        <View style={styles.metadata}>
          <Icon name="star" size={18} />
          <Text style={styles.rating}>
            {number(demoSeries.rating)}{' '}
            <Text style={styles.dim}>
              ({compactNumber(demoSeries.ratingCount)})
            </Text>
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dim}>{demoSeries.year}</Text>
          <Text style={styles.dot}>•</Text>
          <Icon name="episodes" size={16} />
          <Text
            accessibilityLabel={t('seriesMetadata', {
              count: number(demoSeries.episodes.length),
              free: number(
                demoSeries.episodes.filter((episode) => episode.isFree).length,
              ),
            })}
            style={styles.dim}
          >
            {t('compactEpisodes', {
              count: number(demoSeries.episodes.length),
            })}
          </Text>
        </View>
        <View style={styles.actions}>
          {first && <SeriesPlayButton episode={first} onPlay={onPlay} />}
          <IconButton
            label={saved ? t('unsaveSeries') : t('saveLater')}
            outlined
            icon="heart"
            active={saved}
            onPress={onSave}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { aspectRatio: 0.8 },
  navigation: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: { flexDirection: 'row' },
  copy: { position: 'absolute', left: 20, right: 20, bottom: 20, gap: 16 },
  genres: { flexDirection: 'row', gap: 8 },
  genre: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 19,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#322F5680',
    backgroundColor: '#18172B99',
    borderRadius: 11,
    overflow: 'hidden',
  },
  title: { fontSize: 30, lineHeight: 38, letterSpacing: -0.7 },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
  },
  rating: { color: colors.text, fontSize: 14 },
  dim: { color: colors.tertiary, fontSize: 12 },
  dot: { color: colors.outline, marginHorizontal: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

const heroGradient = ['#00000000', '#00000099', '#000000'] as const;
const heroStops = [0, 0.5, 1] as const;
