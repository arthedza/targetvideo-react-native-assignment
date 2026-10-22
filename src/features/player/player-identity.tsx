import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Episode, Series } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { DisplayText } from '../../ui/display-text';
import { colors } from '../../ui/theme';

export const PlayerIdentity = memo(function PlayerIdentity({
  episode,
  series,
}: Readonly<{ episode: Episode; series: Series }>) {
  const { t } = useI18n();
  return (
    <View style={styles.identity}>
      <DisplayText style={styles.title}>{series.title}</DisplayText>
      <View style={styles.metadata}>
        <Text style={styles.badge}>
          {t('episodeShort', { number: episode.number })}
        </Text>
        <Text style={styles.name}>{episode.name}</Text>
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  identity: { gap: 10 },
  title: { fontSize: 20, lineHeight: 27 },
  metadata: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  badge: {
    color: colors.text,
    backgroundColor: '#1E1D35CC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 12,
  },
  name: { color: colors.muted, fontSize: 11, flex: 1 },
});
