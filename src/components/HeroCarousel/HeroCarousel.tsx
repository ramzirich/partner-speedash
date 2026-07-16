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
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { styles } from './HeroCarousel.styles';
import { HeroSlide } from './types';

export interface HeroCarouselProps {
  slides: HeroSlide[];
  intervalMs?: number;
  resumeDelayMs?: number;
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
      indexRef.current = i;
      setIndex(i);
    },
    [width],
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
    ({ item }: { item: HeroSlide }) => (
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
        <View pointerEvents="none" style={styles.scrimTop} />
        <View pointerEvents="none" style={styles.scrimMid} />
        <View pointerEvents="none" style={styles.scrimBottom} />
        <View pointerEvents="none" style={styles.caption}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    ),
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
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const HeroCarousel = React.memo(HeroCarouselComponent);
HeroCarousel.displayName = 'HeroCarousel';
