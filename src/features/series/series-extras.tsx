import { StyleSheet, Text, View } from 'react-native';

import type { Series } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { artwork } from '../../ui/artwork';
import { Cover } from '../../ui/components';
import { DisplayText } from '../../ui/display-text';
import { Icon } from '../../ui/icon';
import { colors } from '../../ui/theme';

export function SeriesExtras({ series }: Readonly<{ series: Series }>) {
  const { t } = useI18n();
  return (
    <>
      <View style={styles.highlights}>
        <View style={styles.highlightHeading}>
          <Icon name="sparkle" size={18} color={colors.secondary} />
          <DisplayText style={styles.heading}>{t('whyLove')}</DisplayText>
        </View>
        {series.highlights.map((line) => (
          <View key={line} style={styles.bullet}>
            <Icon name="flame" size={16} color={colors.primary} />
            <Text style={styles.body}>{line}</Text>
          </View>
        ))}
      </View>
      <View style={styles.cast}>
        <DisplayText accessibilityRole="header">{t('castCrew')}</DisplayText>
        <View style={styles.people}>
          {series.cast.map((person) => (
            <View key={person.name} style={styles.person}>
              <View style={styles.avatar}>
                <Cover
                  source={artwork.cast[person.imageKey]}
                  label={person.role}
                />
              </View>
              <DisplayText style={styles.name}>{person.name}</DisplayText>
              <Text style={styles.role}>{person.role}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  highlights: {
    marginTop: 16,
    padding: 17,
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#18172B66',
    borderWidth: 1,
    borderColor: '#322F564D',
  },
  highlightHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { fontSize: 16, lineHeight: 21 },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  body: { color: colors.tertiary, fontSize: 14, lineHeight: 21, flex: 1 },
  cast: {
    marginTop: 28,
    paddingTop: 28,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#322F5640',
    gap: 24,
  },
  people: { flexDirection: 'row', gap: 12 },
  person: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4 },
  avatar: {
    width: '100%',
    maxWidth: 72,
    aspectRatio: 1,
    borderRadius: 999,
    marginBottom: 4,
    overflow: 'hidden',
  },
  name: { fontSize: 14, lineHeight: 20, minHeight: 40, textAlign: 'center' },
  role: {
    color: colors.tertiary,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
});
