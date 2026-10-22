import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { routes } from '../../core/application/routes';
import type { Episode } from '../../core/domain/catalogue';
import { useI18n } from '../../core/localization/use-i18n';
import { Button } from '../../ui/button';
export function ContinuationButton({
  episode,
  locked,
}: Readonly<{ episode: Episode; locked: boolean }>) {
  const router = useRouter();
  const { t } = useI18n();
  const continueStory = useCallback(() => {
    if (locked) router.push(routes.unlock(episode.id));
    else router.replace(routes.player(episode.id));
  }, [router, locked, episode.id]);
  return (
    <Button
      label={`${locked ? t('unlock') : t('play')} ${episode.title}`}
      onPress={continueStory}
    />
  );
}
