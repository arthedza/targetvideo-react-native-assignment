import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Cover } from '../../ui/components';
import { Icon } from '../../ui/icon';
import { IconButton } from '../../ui/icon-button';
import { colors } from '../../ui/theme';

export function HomeHeader({
  searching,
  onSearch,
}: Readonly<{ searching: boolean; onSearch: () => void }>) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const memoStyle1 = useMemo(
    () => [styles.header, { paddingTop: insets.top }] as const,
    [insets.top],
  );
  return (
    <View style={memoStyle1}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel="DramaFlash"
        style={styles.logo}
      >
        <Icon name="heart" color={colors.background} size={24} />
      </View>
      <View style={styles.actions}>
        <IconButton
          label={searching ? t('closeSearch') : t('searchEpisodes')}
          icon="search"
          onPress={onSearch}
        />
        <View
          accessible
          accessibilityLabel={t('notificationsUnavailable')}
          accessibilityState={accessibilityStateValue2}
          style={styles.bell}
        >
          <Icon name="bell" color={colors.muted} />
          <View style={styles.dot} />
        </View>
        <View style={styles.avatar}>
          <Cover source={artwork.avatar} label={t('demoProfile')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 },
  bell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.65,
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    right: 8,
    top: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 4,
  },
});

const accessibilityStateValue2 = { disabled: true } as const;
