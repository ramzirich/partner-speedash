import React, { useCallback, useMemo } from 'react';
import { Animated, Pressable, StatusBar, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { RiderHero } from '../../components/RiderHero';
import { ValueStrip, ValueStripItem } from '../../components/ValueStrip';
import { ScreenProps } from '../../navigation';
import { colors, spacing } from '../../theme';
import { useLandingAnimation } from './useLandingAnimation';
import { styles } from './LandingScreen.styles';

const RIDER_ARTWORK = require('../../assets/images/delivery1.jpg');

// Partner-side value props. SpeedDash is delivery-only, NOT a marketplace: the
// customer orders from the partner directly, and the partner then asks us for a
// rider. So nothing here may promise demand ("reach more customers", "grow your
// sales") — we sell the drop-off, not the order.
const VALUE_ITEMS: ValueStripItem[] = [
  { key: 'riders', icon: 'bicycle-outline', label: 'Riders on demand' },
  { key: 'tracking', icon: 'navigate-outline', label: 'Live tracking' },
  { key: 'support', icon: 'headset-outline', label: '24/7 support' },
];

const LandingScreenComponent: React.FC<ScreenProps<'Landing'>> = ({
  navigation,
}) => {
  const animated = useLandingAnimation();
  const insets = useSafeAreaInsets();

  const heroStyle = useMemo(
    () => [styles.hero, { paddingTop: insets.top + spacing.lg }, animated.hero],
    [insets.top, animated.hero],
  );

  const handleSignIn = useCallback(
    () => navigation.navigate('SignIn'),
    [navigation],
  );

  const handleSignUp = useCallback(
    () => navigation.navigate('SignUp'),
    [navigation],
  );

  // TODO: remove — dev shortcut to jump straight to Home (skips sign-in).
  const handleDevGoHome = useCallback(
    () => navigation.navigate('Home', { email: 'ramzi@gmail.com' }),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Pale hero behind a translucent bar → dark icons. */}
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor={colors.transparent}
      />
      <View style={styles.container}>
        <Animated.View style={heroStyle}>
          <View pointerEvents="none" style={styles.backdrop}>
            <View style={styles.backdropBlob} />
            <View style={styles.backdropBlobSoft} />
            <View style={styles.backdropAccent} />
          </View>
          <RiderHero
            source={RIDER_ARTWORK}
            facing="left"
            travel="loop"
            showSpeedLines
            showDust
            dropWhiteBackground
            showShadow={false}
          />

          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>Partner with SpeedDash</Text>
            <Text style={styles.subhead}>
              Your customers order from you. We get it to their door.
            </Text>
          </View>
        </Animated.View>

        {/* Content — one primary CTA, everything else subordinate to it. */}
        <Animated.View style={[styles.content, animated.content]}>
          <ValueStrip items={VALUE_ITEMS} />

          <View style={styles.actions}>
            <AppButton
              label="Sign In"
              variant="primary"
              fullWidth
              onPress={handleSignIn}
              testID="landing-sign-in"
            />

            <View style={styles.altActionRow}>
              <Text style={styles.altActionPrompt}>New to SpeedDash?</Text>
              <Pressable
                onPress={handleSignUp}
                hitSlop={8}
                style={styles.altActionHit}
                accessibilityRole="button"
                accessibilityLabel="Sign up"
                testID="landing-sign-up">
                <Text style={styles.altActionLink}>Sign up</Text>
              </Pressable>
            </View>

            {/* TODO: remove — dev-only shortcut to Home, bypasses sign-in. */}
            <AppButton
              label="Go to Home (dev)"
              variant="ghost"
              fullWidth
              onPress={handleDevGoHome}
              testID="landing-dev-home"
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export const LandingScreen = React.memo(LandingScreenComponent);
LandingScreen.displayName = 'LandingScreen';
