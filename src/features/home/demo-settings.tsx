import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDemoRuntime } from '../../core/application/demo-runtime';
import { useUiStore } from '../../core/application/ui-store';
import type { Fault } from '../../core/infrastructure/mock/transport';
import { useI18n } from '../../core/localization/use-i18n';
import { Button } from '../../ui/components';
import { colors } from '../../ui/theme';
import { DemoSettingButton } from './demo-setting-button';

export function DemoSettings() {
  const { api } = useDemoRuntime();
  const { t } = useI18n();
  const setMode = useUiStore((state) => state.setNetworkMode);
  const mode = useUiStore((state) => state.networkMode);
  const [expanded, setExpanded] = useState(false);
  const [armed, setArmed] = useState(false);
  const armFailure = useCallback(
    (value: Fault) => {
      api.failNext(value);
      setArmed(true);
    },
    [api],
  );
  const toggleExpanded = useCallback(
    () => setExpanded((value) => !value),
    [setExpanded],
  );
  return (
    <View style={styles.panel}>
      <Button label={t('demoSettings')} secondary onPress={toggleExpanded} />
      {expanded && (
        <>
          {(
            [
              ['normal', 'normalConnection'],
              ['slow', 'slowConnection'],
              ['offline', 'offlineConnection'],
            ] as const
          ).map(([value, key]) => (
            <DemoSettingButton
              key={value}
              value={value}
              label={`${mode === value ? '✓ ' : ''}${t(key)}`}
              onSelect={setMode}
            />
          ))}
          {(
            [
              ['network', 'failNext'],
              ['lost-response', 'loseResponse'],
              ['invalid-response', 'invalidNext'],
            ] as const
          ).map(([value, key]) => (
            <DemoSettingButton
              key={value}
              value={value}
              label={t(key)}
              onSelect={armFailure}
            />
          ))}
          {armed && (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              {t('failureArmed')}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { gap: 10 },
  text: { color: colors.muted, textAlign: 'center' },
});
