import React, { useCallback } from 'react';
import { Animated, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { HeroCarousel, HeroSlide } from '../../components/HeroCarousel';
import { ScreenProps } from '../../navigation';
import { colors } from '../../theme';
import { useLandingAnimation } from './useLandingAnimation';
import { styles } from './LandingScreen.styles';


const HERO_SLIDES: HeroSlide[] = [
  {
    key: 'vision',
    image: require('../../assets/images/logo.png'),
    resizeMode: 'contain',
    backgroundColor: colors.background,
    title: 'Delivering more than parcels',
    subtitle:
      'SpeedDash connects neighbourhoods, riders and restaurants — fast, fair and reliable.',
  },
  {
    key: 'riders',
    image: {
      uri: 'https://images.unsplash.com/photo-1753806901333-44632dc78b49?w=1080&q=80',
    },
    title: 'Ride with us. Earn on your terms.',
    subtitle:
      'Flexible shifts, transparent pay and instant tips. Become a SpeedDash rider today.',
  },
  {
    key: 'restaurants',
    image: {
      uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80',
    },
    title: 'Grow your restaurant',
    subtitle:
      'Reach more hungry customers and let our riders handle every delivery. Partner with SpeedDash.',
  },
];

const LandingScreenComponent: React.FC<ScreenProps<'Landing'>> = ({
  navigation,
}) => {
  const animated = useLandingAnimation();

  const handleSignIn = useCallback(
    () => navigation.navigate('SignIn'),
    [navigation],
  );

  const handleForgotPassword = useCallback(
    () => navigation.navigate('ForgotPassword'),
    [navigation],
  );

  // TODO: remove — dev shortcut to jump straight to Home (skips sign-in).
  const handleDevGoHome = useCallback(
    () => navigation.navigate('Home', { email: 'ramzi@gmail.com' }),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        {/* Hero — auto-advancing carousel (vision → riders → restaurants) */}
        <Animated.View style={[styles.heroWrapper, animated.hero]}>
          <HeroCarousel slides={HERO_SLIDES} intervalMs={3500} />
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, animated.content]}>
          <View style={styles.actions}>
            <AppButton
              label="Sign In"
              variant="primary"
              fullWidth
              onPress={handleSignIn}
              testID="landing-sign-in"
            />
            <Pressable
              onPress={handleForgotPassword}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

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
