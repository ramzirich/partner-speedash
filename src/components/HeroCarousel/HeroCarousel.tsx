import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { styles } from './HeroCarousel.styles';
import { HeroSlide, HeroSlideTone } from './types';

/**
 * Tone-keyed style arrays, hoisted to module scope so they're allocated once
 * instead of on every render (they'd otherwise break `memo` on the rows).
 */
const TITLE_STYLES: Record<HeroSlideTone, StyleProp<TextStyle>> = {
  dark: styles.title,
  light: [styles.title, styles.titleLight],
};
const SUBTITLE_STYLES: Record<HeroSlideTone, StyleProp<TextStyle>> = {
  dark: styles.subtitle,
  light: [styles.subtitle, styles.subtitleLight],
};
const DOT_STYLES: Record<HeroSlideTone, StyleProp<ViewStyle>> = {
  dark: styles.dot,
  light: [styles.dot, styles.dotOnLight],
};
const DOT_ACTIVE: StyleProp<ViewStyle> = [styles.dot, styles.dotActive];

export interface HeroCarouselProps {
  slides: HeroSlide[];
  intervalMs?: number;
  resumeDelayMs?: number;
  onIndexChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Behaviour:
 *  - Advances every `intervalMs` and loops back to the first slide.
 *  - Pauses on touch/drag and resumes `resumeDelayMs` after the last
 *    interaction, so it never fights the user's finger.
 *  - Honours the OS "Reduce Motion" setting (no auto-advance; manual swipe
 *    and dot taps still work).
 *  - Re-aligns to the current slide on rotation / size changes.
 */
const HeroCarouselComponent: React.FC<HeroCarouselProps> = ({
  slides,
  intervalMs = 2000,
  resumeDelayMs = 6000,
  onIndexChange,
  style,
}) => {
  const { width } = useWindowDimensions();
  const count = slides.length;

  const listRef = useRef<FlatList<HeroSlide>>(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  // --- Reduce Motion ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const goTo = useCallback(
    (next: number, animated = true) => {
      if (!listRef.current || count === 0) {
        return;
      }
      const wrapped = ((next % count) + count) % count;
      listRef.current.scrollToOffset({ offset: wrapped * width, animated });
    },
    [count, width],
  );

  // --- Auto-advance ----------------------------------------------------------
  useEffect(() => {
    if (reduceMotion || count <= 1) {
      return;
    }
    const id = setInterval(() => {
      if (pausedRef.current) {
        return;
      }
      goTo(indexRef.current + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [goTo, intervalMs, reduceMotion, count]);

  // Keep the right slide in view after a rotation / width change.
  useEffect(() => {
    const id = setTimeout(() => goTo(indexRef.current, false), 0);
    return () => clearTimeout(id);
  }, [goTo]);

  useEffect(
    () => () => {
      if (resumeTimer.current) {
        clearTimeout(resumeTimer.current);
      }
    },
    [],
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
    }
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
    }
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, resumeDelayMs);
  }, [resumeDelayMs]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      if (i === indexRef.current) {
        return;
      }
      indexRef.current = i;
      setIndex(i);
      onIndexChange?.(i);
    },
    [width, onIndexChange],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<HeroSlide> | null | undefined, i: number) => ({
      length: width,
      offset: width * i,
      index: i,
    }),
    [width],
  );

  const renderItem = useCallback(
    ({ item }: { item: HeroSlide }) => {
      const tone = item.tone ?? 'dark';
      const isDark = tone === 'dark';

      return (
        <View
          style={[
            styles.slide,
            { width },
            item.backgroundColor
              ? { backgroundColor: item.backgroundColor }
              : null,
          ]}
          accessible
          accessibilityLabel={`${item.title}. ${item.subtitle}`}>
          <Image
            source={item.image}
            resizeMode={item.resizeMode ?? 'cover'}
            style={styles.image}
          />
          {isDark ? (
            <>
              <View pointerEvents="none" style={styles.statusScrim1} />
              <View pointerEvents="none" style={styles.statusScrim2} />
              <View pointerEvents="none" style={styles.statusScrim3} />
              <View pointerEvents="none" style={styles.scrim1} />
              <View pointerEvents="none" style={styles.scrim2} />
              <View pointerEvents="none" style={styles.scrim3} />
              <View pointerEvents="none" style={styles.scrim4} />
              <View pointerEvents="none" style={styles.scrim5} />
              <View pointerEvents="none" style={styles.scrim6} />
            </>
          ) : null}
          <View pointerEvents="none" style={styles.caption}>
            <Text style={TITLE_STYLES[tone]}>{item.title}</Text>
            <Text style={SUBTITLE_STYLES[tone]}>{item.subtitle}</Text>
          </View>
        </View>
      );
    },
    [width],
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onScrollBeginDrag={pause}
        onScrollEndDrag={scheduleResume}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      {count > 1 ? (
        <View style={styles.dots} pointerEvents="box-none">
          {slides.map((slide, i) => (
            <Pressable
              key={slide.key}
              onPress={() => {
                pause();
                goTo(i);
                scheduleResume();
              }}
              hitSlop={8}
              style={styles.dotHit}
              accessibilityRole="button"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={`Show slide ${i + 1} of ${count}`}>
              <View
                style={
                  i === index
                    ? DOT_ACTIVE
                    : DOT_STYLES[slides[index]?.tone ?? 'dark']
                }
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const HeroCarousel = React.memo(HeroCarouselComponent);
HeroCarousel.displayName = 'HeroCarousel';
