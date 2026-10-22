import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../ui/theme';
export const HomeCategoryChip = memo(function HomeCategoryChip({
  id,
  title,
  selected,
  onSelect,
}: Readonly<{
  id: string;
  title: string;
  selected: boolean;
  onSelect: (id: string) => void;
}>) {
  const accessibilityState = useMemo(() => ({ selected }), [selected]);
  const select = useCallback(() => onSelect(id), [onSelect, id]);
  const labelStyle = useMemo(
    () => [styles.filter, selected && styles.selected] as const,
    [selected],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={accessibilityState}
      onPress={select}
      style={styles.filterTouch}
    >
      <Text style={labelStyle}>{title}</Text>
    </Pressable>
  );
});
const styles = StyleSheet.create({
  filterTouch: { minHeight: 44, justifyContent: 'center' },
  filter: {
    color: colors.muted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    lineHeight: 18,
  },
  selected: {
    color: colors.onAccent,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
