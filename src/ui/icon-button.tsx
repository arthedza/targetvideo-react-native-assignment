import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { colors } from './theme';

export const IconButton = memo(function IconButton({
  label,
  icon,
  onPress,
  active = false,
  outlined = false,
  disabled = false,
}: Readonly<{
  label: string;
  icon: IconName;
  onPress: () => void;
  active?: boolean;
  outlined?: boolean;
  disabled?: boolean;
}>) {
  const accessibilityState = useMemo(
    () => ({ selected: active, disabled }) as const,
    [active, disabled],
  );
  const buttonStyle = useMemo(
    () => [styles.button, outlined && styles.large] as const,
    [outlined],
  );
  const circleStyle = useMemo(
    () => [styles.circle, outlined && styles.outline] as const,
    [outlined],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      style={buttonStyle}
    >
      <View style={circleStyle}>
        <Icon
          name={icon}
          size={22}
          color={active ? colors.primary : colors.text}
          filled={active && icon === 'heart'}
        />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { width: 48, height: 48 },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#C0BEDA33',
    backgroundColor: '#18172B4D',
  },
});
