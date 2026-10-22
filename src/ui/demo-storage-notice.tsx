import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../core/localization/use-i18n';
import { Button } from './components';
import { colors } from './theme';

export function DemoStorageNotice({
  loading,
  error,
  onRetry,
  onReset,
  busy = false,
}: Readonly<{
  loading: boolean;
  error: 'load' | 'save' | null;
  onRetry: () => void;
  onReset: () => void;
  busy?: boolean;
}>) {
  const { t } = useI18n();
  let message = t('loadingDemo');
  if (error === 'load') message = t('loadError');
  else if (error === 'save') message = t('saveError');
  if (!loading && !error) return null;
  return (
    <View style={styles.notice}>
      <Text accessibilityRole={error ? 'alert' : 'text'} style={styles.text}>
        {message}
      </Text>
      {error && (
        <>
          <Button label={t('retryStorage')} disabled={busy} onPress={onRetry} />
          <Button
            label={t('resetDemo')}
            secondary
            disabled={busy}
            onPress={onReset}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { padding: 20, gap: 12, backgroundColor: colors.surface },
  text: { color: colors.text, fontSize: 14 },
});
