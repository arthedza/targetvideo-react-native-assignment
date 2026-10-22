import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EpisodeAccess } from '../../core/domain/access/episode-access';
import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Cover } from '../../ui/cover';
import { DisplayText } from '../../ui/display-text';
import { colors } from '../../ui/theme';

export const HomeEpisodeCard = memo(function HomeEpisodeCard({
  episode,
  access,
  poster,
  onEpisode,
}: Readonly<{
  episode: Episode;
  access: EpisodeAccess;
  poster: number;
  onEpisode: (episode: Episode) => void;
}>) {
  const { t, coins } = useI18n();
  const select = useCallback(() => onEpisode(episode), [onEpisode, episode]);
  const locked = access === 'locked';
  const availableLabel =
    access === 'unlocked'
      ? t('unlocked').toLocaleUpperCase()
      : t('free').toLocaleUpperCase();
  const priceLabel =
    episode.unlockPriceCoins === null
      ? t('unavailable')
      : coins(episode.unlockPriceCoins);
  const badgeLabel = locked ? priceLabel.toLocaleUpperCase() : availableLabel;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${locked ? t('unlock') : t('play')} ${episode.name}`}
      onPress={select}
      style={styles.card}
    >
      <View style={styles.poster}>
        <Cover
          source={artwork.posters[poster]}
          label={t('artwork', { title: episode.name })}
        />
        <LinearGradient colors={posterGradient} style={styles.shade} />
        <LinearGradient
          colors={badgeGradient}
          start={gradientStart}
          end={gradientEnd}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </LinearGradient>
        <View style={styles.metadata}>
          <Text style={styles.caption}>
            {t('episodeShort', { number: episode.number })}
          </Text>
          <Text
            style={styles.caption}
          >{`0:${episode.durationSeconds.toString().padStart(2, '0')}`}</Text>
        </View>
      </View>
      <DisplayText style={styles.name} numberOfLines={2}>
        {episode.name}
      </DisplayText>
    </Pressable>
  );
});
const styles = StyleSheet.create({
  card: { width: 128 },
  poster: {
    height: 193,
    width: 128,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
  },
  metadata: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: { color: colors.muted, fontSize: 10 },
  name: { fontSize: 14, lineHeight: 19, marginTop: 10, minHeight: 38 },
});

const posterGradient = ['#00000000', '#000000CC'] as const;
const badgeGradient = [colors.primary, colors.secondary] as const;
const gradientStart = { x: 0, y: 0 } as const;
const gradientEnd = { x: 1, y: 0 } as const;
