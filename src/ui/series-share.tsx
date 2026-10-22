import { useCallback, useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { useUiStore } from '../core/application/ui-store';
import { useI18n } from '../core/localization/use-i18n';
import { IconButton } from './icon-button';
import { colors } from './theme';

export function SeriesShare({ title }: Readonly<{ title: string }>) {
  const { t } = useI18n();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const shareSeries = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setFailed(false);
    void Share.share({ message: title })
      .catch((error: unknown) => {
        const cancelled =
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError';
        if (alive.current && !cancelled) {
          setFailed(true);
          useUiStore.getState().notify('share');
        }
      })
      .finally(() => {
        busy.current = false;
        if (alive.current) setPending(false);
      });
  }, [title]);
  return (
    <View>
      <IconButton
        label={t('shareSeries')}
        icon="share"
        disabled={pending}
        onPress={shareSeries}
      />
      {failed && (
        <Text accessibilityRole="alert" style={styles.error}>
          {t('shareError')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    position: 'absolute',
    right: 0,
    top: 48,
    width: 180,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    color: colors.text,
    fontSize: 12,
  },
});
