import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { apiMessageKeys } from '../core/application/api-errors';
import { useUiStore } from '../core/application/ui-store';
import { useI18n } from '../core/localization/use-i18n';
import { colors } from './theme';

export function ToastHost() {
  const { t } = useI18n();
  const notice = useUiStore((state) => state.notice);
  const id = useUiStore((state) => state.noticeId);
  const dismiss = useUiStore((state) => state.dismissNotice);
  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [notice, id, dismiss]);
  if (!notice) return null;
  return (
    <View style={styles.toast}>
      <Text accessibilityLiveRegion="polite" style={styles.text}>
        {t(apiMessageKeys[notice])}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dismissNotice')}
        onPress={dismiss}
        style={styles.dismiss}
      >
        <Text style={styles.text}>×</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  text: { color: colors.text, flex: 1, fontSize: 13 },
  dismiss: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
