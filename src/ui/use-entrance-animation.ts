import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

export function useEntranceAnimation() {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let alive = true;
    let animation: Animated.CompositeAnimation | undefined;
    const update = (reduceMotion: boolean) => {
      if (!alive) return;
      animation?.stop();
      if (reduceMotion) {
        opacity.setValue(1);
        return;
      }
      opacity.setValue(0);
      animation = Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      });
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => {
        if (alive) opacity.setValue(1);
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      update,
    );
    return () => {
      alive = false;
      subscription.remove();
      animation?.stop();
    };
  }, [opacity]);
  return opacity;
}
