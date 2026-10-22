import { Text, type TextProps } from 'react-native';

import { useI18n } from '../core/localization/use-i18n';

export function DemoBalance({
  coins,
  style,
}: Readonly<{ coins: number; style?: TextProps['style'] }>) {
  const { t, coins: formatCoins } = useI18n();
  return (
    <Text style={style}>{t('wallet', { coins: formatCoins(coins) })}</Text>
  );
}
