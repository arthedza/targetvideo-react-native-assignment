import { useCallback } from 'react';

import { Button } from '../../ui/button';
export function DemoSettingButton<Value extends string>({
  value,
  label,
  onSelect,
}: Readonly<{
  value: Value;
  label: string;
  onSelect: (value: Value) => void;
}>) {
  const select = useCallback(() => onSelect(value), [onSelect, value]);
  return <Button label={label} secondary onPress={select} />;
}
