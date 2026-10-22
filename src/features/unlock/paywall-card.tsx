import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Catalogue } from '../../core/domain/api-schemas';
import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Button, Cover } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { colors, shadows } from '../../ui/theme';

type Props = Readonly<{
  episode: string;
  price: number | null;
  balance: number;
  remaining: number | undefined;
  notice: string | undefined;
  pending: boolean;
  loading: boolean;
  plans: Catalogue['plans'];
  disabled: boolean;
  onConfirm: () => void;
  onLater: () => void;
}>;

export function PaywallCard({
  episode,
  price,
  balance,
  remaining,
  notice,
  pending,
  loading,
  plans,
  disabled,
  onConfirm,
  onLater,
}: Props) {
  const { t, coins } = useI18n();
  const idleLabel = loading ? t('loadingOffer') : t('unlockNow');
  const buttonLabel = pending ? t('unlocking') : idleLabel;
  const priceLabel = price === null ? t('unavailable') : coins(price);
  const idleAria = loading
    ? t('loadingOffer')
    : t('unlockFor', { coins: priceLabel });
  const buttonAria = pending ? t('unlocking') : idleAria;
  const cancelState = useMemo(
    () => ({ disabled: pending }) as const,
    [pending],
  );
  return (
    <View style={styles.card}>
      <View style={styles.thumbnail}>
        <Cover source={artwork.unlock} label={t('lockedPreview')} />
        <View style={styles.lock}>
          <View style={styles.lockIcon}>
            <Icon name="lock" size={20} color={colors.text} />
          </View>
          <Text style={styles.lockText}>{t('locked')}</Text>
        </View>
      </View>
      <DisplayText style={styles.episode}>{episode.toUpperCase()}</DisplayText>
      <DisplayText
        accessibilityRole="header"
        accessibilityLabel={t('unlockTitle', { episode })}
        style={styles.title}
      >
        {t('continueRomance')}
      </DisplayText>
      <Text style={styles.subtitle}>{t('unlockDescription')}</Text>
      <View style={styles.offers}>
        <View style={selectedOfferStyle}>
          <View
            accessible
            accessibilityRole="radio"
            accessibilityLabel={t('unlockEpisode')}
            accessibilityState={selectedState}
            style={checkedRadioStyle}
          >
            <Icon name="check" size={13} color={colors.primary} />
          </View>
          <View style={styles.offerCopy}>
            <Text style={styles.offerTitle}>{t('unlockEpisode')}</Text>
            <Text style={styles.offerCaption}>{t('oneTimeAccess')}</Text>
          </View>
          <Text
            accessibilityLabel={t('price', { coins: priceLabel })}
            style={styles.price}
          >
            {priceLabel}
          </Text>
        </View>
        {plans.map((offer) => (
          <View
            key={offer.id}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={
              offer.id === 'season' ? t('seasonPreview') : t('premiumPreview')
            }
            accessibilityState={previewState}
            style={previewStyle}
          >
            <View style={styles.radio} />
            <View style={styles.offerCopy}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerCaption}>{t('unavailablePreview')}</Text>
            </View>
            <Text style={styles.price}>{offer.priceLabel}</Text>
          </View>
        ))}
      </View>
      <View style={styles.wallet}>
        <Text style={styles.walletText}>
          {t('balance', { coins: coins(balance) })}
        </Text>
        {remaining !== undefined && (
          <Text style={styles.walletText}>
            {t('afterUnlock', { coins: coins(remaining) })}
          </Text>
        )}
      </View>
      {notice && (
        <Text accessibilityRole="alert" style={styles.notice}>
          {notice}
        </Text>
      )}
      <Button
        label={buttonLabel}
        accessibilityLabel={buttonAria}
        icon="lock"
        disabled={disabled}
        onPress={onConfirm}
        style={styles.confirm}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('maybeLater')}
        accessibilityState={cancelState}
        disabled={pending}
        onPress={onLater}
        style={styles.later}
      >
        <Text style={styles.laterText}>{t('maybeLater')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 728,
    borderRadius: 24,
    backgroundColor: colors.panel,
    padding: 25,
    borderWidth: 1,
    borderColor: '#FFFFFF0D',
    alignItems: 'center',
  },
  thumbnail: {
    width: 110,
    height: 142,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  lock: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0000004D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  episode: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  title: { marginTop: 6, fontSize: 24, lineHeight: 32, textAlign: 'center' },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  offers: { width: '100%', gap: 12, marginTop: 26 },
  offer: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#64EDF71A',
    boxShadow: '0 0 12px #64EDF726',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { borderColor: colors.primary },
  offerCopy: { flex: 1, gap: 4 },
  offerTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  offerCaption: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  price: { color: colors.text, fontSize: 13, fontWeight: '700' },
  preview: { opacity: 0.45 },
  wallet: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 14,
    minHeight: 40,
  },
  walletText: { fontSize: 10, lineHeight: 16, color: colors.muted },
  notice: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  confirm: {
    width: '100%',
    borderRadius: 14,
    minHeight: 52,
    boxShadow: shadows.primaryCta,
  },
  later: { minHeight: 44, justifyContent: 'center', marginTop: 10 },
  laterText: { color: colors.muted, fontSize: 14 },
});

const selectedOfferStyle = [styles.offer, styles.selected] as const;
const selectedState = { checked: true } as const;
const checkedRadioStyle = [styles.radio, styles.checked] as const;
const previewState = { disabled: true, checked: false } as const;
const previewStyle = [styles.offer, styles.preview] as const;
