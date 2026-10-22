import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EpisodeAccess } from '../../core/domain/access/episode-access';
import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Cover } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { colors } from '../../ui/theme';

export const EpisodeRow = memo(function EpisodeRow({
  episode,
  access,
  onSelect,
}: Readonly<{
  episode: Episode;
  access: EpisodeAccess;
  onSelect: (episode: Episode) => void;
}>) {
  const onPress = useCallback(() => onSelect(episode), [onSelect, episode]);
  const { t } = useI18n();
  const locked = access === 'locked';
  const availableLabel = access === 'free' ? t('free') : t('unlocked');
  const accessLabel = locked ? t('unlock') : availableLabel;
  const overlayStyle = useMemo(
    () => [styles.overlay, locked && styles.locked] as const,
    [locked],
  );
  const badgeStyle = useMemo(
    () => [styles.badge, locked && styles.lockBadge] as const,
    [locked],
  );
  const accessStyle = useMemo(
    () => [styles.access, locked && styles.unlock] as const,
    [locked],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${locked ? t('unlock') : t('play')} ${episode.title}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.thumbnail}>
        <Cover
          source={artwork.episodes[episode.number - 1]}
          label={t('episodePreview', { title: episode.title })}
        />
        <View style={overlayStyle}>
          <View style={badgeStyle}>
            <Icon
              name={locked ? 'lock' : 'play'}
              color={locked ? colors.text : colors.onAccent}
              size={18}
            />
          </View>
        </View>
      </View>
      <View style={styles.copy}>
        <DisplayText style={styles.name}>
          {episode.number}. {episode.name}
        </DisplayText>
        <View style={styles.metadata}>
          <Icon name="clock" size={12} color={colors.tertiary} />
          <Text
            style={styles.duration}
          >{`0:${episode.durationSeconds.toString().padStart(2, '0')}`}</Text>
          <Text style={accessStyle}>{accessLabel}</Text>
          {locked && <Icon name="lock" size={12} color={colors.secondary} />}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 15,
    minHeight: 93,
  },
  thumbnail: {
    width: 112,
    height: 63,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.elevated,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { backgroundColor: '#00000066' },
  badge: {
    width: 30,
    height: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64EDF7E6',
  },
  lockBadge: { backgroundColor: '#000000CC' },
  copy: { flex: 1, gap: 6 },
  name: { fontSize: 14, lineHeight: 21 },
  metadata: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duration: { color: colors.tertiary, fontSize: 12 },
  access: { color: colors.tertiary, fontSize: 12, marginLeft: 4 },
  unlock: { color: colors.secondary },
});
