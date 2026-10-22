import { memo, useCallback, useMemo } from 'react';
import {
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  Text,
  type ViewStyle,
} from 'react-native';

import { componentStyles as styles } from './component-styles';
import { Icon, type IconName } from './icon';
import { colors } from './theme';

type ButtonProps = Readonly<{
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}>;

export const Button = memo(function Button({
  label,
  accessibilityLabel,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const accessibilityState = useMemo(() => ({ disabled }), [disabled]);
  const restOpacity = disabled ? 0.45 : 1;
  const pressStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.button,
      secondary && styles.secondary,
      disabled && styles.disabled,
      style,
      { opacity: pressed ? 0.8 : restOpacity },
    ],
    [secondary, disabled, style, restOpacity],
  );
  const labelStyle = useMemo(
    () => [styles.buttonText, secondary && styles.secondaryText] as const,
    [secondary],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      style={pressStyle}
    >
      {icon && (
        <Icon name={icon} color={secondary ? colors.text : colors.onAccent} />
      )}
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
  );
});
