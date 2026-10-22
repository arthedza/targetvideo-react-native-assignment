import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../core/localization/use-i18n';
import { Icon } from './icon';
import { colors } from './theme';

const destinations = [
  ['home', 'home'],
  ['discover', 'search'],
  ['romance', 'heart'],
  ['library', 'bookmark'],
  ['profile', 'profile'],
] as const;

export function BottomNavigation({ onHome }: Readonly<{ onHome: () => void }>) {
  const { t } = useI18n();
  return (
    <View style={styles.bar}>
      {destinations.map(([key, icon]) => {
        const name = t(key);
        const disabled = key !== 'home';
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={
              disabled ? t('previewDestination', { name }) : name
            }
            accessibilityHint={disabled ? t('notAvailable') : t('returnHome')}
            accessibilityState={disabled ? disabledState : activeState}
            disabled={disabled}
            onPress={onHome}
            style={disabled ? disabledItem : styles.item}
          >
            <Icon
              name={icon}
              size={22}
              color={disabled ? colors.muted : colors.primary}
            />
            <Text style={disabled ? styles.label : activeLabel}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.background,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: { color: colors.muted, fontSize: 10 },
  active: { color: colors.primary, fontWeight: '600' },
  disabled: { opacity: 0.55 },
});

const disabledState = { disabled: true, selected: false };
const activeState = { disabled: false, selected: true };
const disabledItem = [styles.item, styles.disabled];
const activeLabel = [styles.label, styles.active];
