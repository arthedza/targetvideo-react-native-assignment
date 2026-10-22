import { memo, useCallback, useState } from 'react';
import {
  Image,
  type ImageResizeMode,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useI18n } from '../core/localization/use-i18n';
import { artwork } from './artwork';
import { componentStyles as styles } from './component-styles';
import { typography } from './theme';

export const Cover = memo(function Cover({
  source = artwork.series,
  label,
  resizeMode = 'cover',
}: Readonly<{
  source?: ImageSourcePropType;
  label?: string;
  resizeMode?: ImageResizeMode;
}>) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);

  const showFallback = useCallback(() => setFailed(true), [setFailed]);
  if (failed) {
    return (
      <View style={styles.fallback}>
        <Text style={typography.caption}>{t('artworkError')}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      accessibilityLabel={label ?? t('seriesCover')}
      resizeMode={resizeMode}
      onError={showFallback}
      style={coverStyle}
    />
  );
});

const coverStyle = [StyleSheet.absoluteFill, styles.image] as const;
