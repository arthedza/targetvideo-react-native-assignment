import {
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { componentStyles as styles } from './component-styles';
import { useEntranceAnimation } from './use-entrance-animation';

export function Screen({
  children,
  fullBleed = false,
  scrollable = true,
  contentStyle,
  footer,
  header,
}: PropsWithChildren<{
  fullBleed?: boolean;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  header?: ReactNode;
}>) {
  const insets = useSafeAreaInsets();
  const [scrolled, setScrolled] = useState(false);
  const updateScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrolled(event.nativeEvent.contentOffset.y > 0);
    },
    [],
  );
  const insetCoverStyle = useMemo(
    () =>
      [
        styles.insetCover,
        { height: fullBleed && scrollable && scrolled ? insets.top : 0 },
      ] as const,
    [fullBleed, scrollable, scrolled, insets.top],
  );
  const opacity = useEntranceAnimation();
  const animatedStyle = useMemo(() => ({ flex: 1, opacity }), [opacity]);
  const safeAreaEdges = useMemo(
    () => (fullBleed ? (['bottom'] as const) : (['top', 'bottom'] as const)),
    [fullBleed],
  );
  const scrollContentStyle = useMemo(
    () => [styles.content, !fullBleed && styles.inset, contentStyle] as const,
    [fullBleed, contentStyle],
  );
  const fixedContentStyle = useMemo(
    () =>
      [
        styles.content,
        styles.fixed,
        !fullBleed && styles.inset,
        contentStyle,
      ] as const,
    [fullBleed, contentStyle],
  );
  return (
    <Animated.View style={animatedStyle}>
      <SafeAreaView style={styles.screen} edges={safeAreaEdges}>
        {header}
        {scrollable ? (
          <ScrollView
            testID="page-scroll"
            contentContainerStyle={scrollContentStyle}
            onScroll={updateScroll}
            scrollEventThrottle={32}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={fixedContentStyle}>{children}</View>
        )}
        {footer}
      </SafeAreaView>
      <View
        testID="system-inset-cover"
        pointerEvents="none"
        style={insetCoverStyle}
      />
    </Animated.View>
  );
}
