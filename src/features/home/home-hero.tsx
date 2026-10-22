import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { Series } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Button, Cover } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { IconButton } from '../../ui/icon-button';
import { colors, shadows } from '../../ui/theme';

export function HomeHero({
  series: demoSeries,
  saved,
  onSave,
  onWatch,
}: Readonly<{
  series: Series;
  saved: boolean;
  onSave: () => void;
  onWatch: () => void;
}>) {
  const { t, number, episodes } = useI18n();
  const { width } = useWindowDimensions();
  const size = Math.min(36, (Math.min(width, 430) - 48) / 9.5);
  const titleStyle = useMemo(
    () => [styles.title, { fontSize: size }] as const,
    [size],
  );
  return (
    <View style={styles.hero}>
      <Cover source={artwork.spotlight} />
      <LinearGradient
        colors={imageGradient}
        locations={heroStops}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={heroGradient}
        locations={heroStops}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tint} />
      <View style={styles.copy}>
        <View style={styles.genres}>
          <Text style={styles.spotlight}>{t('spotlight')}</Text>
          {demoSeries.homeGenres.map((genre, index) => (
            <Text key={genre} style={styles.genre}>
              {genre}
              {index < demoSeries.homeGenres.length - 1 ? ' ·' : ''}
            </Text>
          ))}
        </View>
        <DisplayText accessibilityRole="header" style={titleStyle}>
          {demoSeries.title}
        </DisplayText>
        <Text style={styles.tagline}>{demoSeries.tagline}</Text>
        <View style={styles.metadata}>
          <Icon name="star" size={16} />
          <Text style={styles.rating}>{number(demoSeries.rating)}</Text>
          <Text style={styles.dot}>▪</Text>
          <Text style={styles.rating}>
            {episodes(demoSeries.episodes.length)}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label={t('watchNow')}
            icon="play"
            onPress={onWatch}
            style={styles.watch}
          />
          <IconButton
            label={saved ? t('removeWatchlist') : t('addWatchlist')}
            icon={saved ? 'check' : 'plus'}
            active={saved}
            outlined
            onPress={onSave}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { aspectRatio: 0.75, backgroundColor: '#001214' },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: '#64EDF71A' },
  copy: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  genres: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  spotlight: {
    color: colors.secondary,
    fontSize: 12,
    lineHeight: 19,
    paddingHorizontal: 10,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#CB64F733',
    borderWidth: 1,
    borderColor: '#CB64F766',
    fontWeight: '600',
  },
  genre: { color: colors.muted, fontSize: 11 },
  title: { lineHeight: 44, marginTop: 10, letterSpacing: -0.8 },
  tagline: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 18,
  },
  rating: { color: colors.muted, fontSize: 14 },
  dot: { color: '#9CA3AF88', marginHorizontal: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  watch: { flex: 1, boxShadow: shadows.primaryCta },
});

const imageGradient = ['#00000066', '#00000000', '#0000001A'] as const;
const heroGradient = ['#00000000', '#000000CC', '#000000'] as const;
const heroStops = [0, 0.5, 1] as const;
