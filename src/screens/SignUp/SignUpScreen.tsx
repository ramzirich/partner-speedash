import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Animated,
  Linking,
  ScrollView,
  StatusBar,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { BrandBackdrop } from '../../components/BrandBackdrop';
import { BrandHeader } from '../../components/BrandHeader';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { ScreenProps } from '../../navigation';
import { styles } from './SignUpScreen.styles';

// TODO: replace with the real onboarding contact number.
const CONTACT_NUMBER = '+961 81793281';
const CONTACT_WA = CONTACT_NUMBER.replace(/\D/g, '');
const CONTACT_MESSAGE = "Hi! I'd like to sign up as a SpeedDash driver.";

/** Content groups that stagger in after the brand mark: intro, actions. */
const ENTRANCE_GROUPS = 2;

const SignUpScreenComponent: React.FC<ScreenProps<'SignUp'>> = ({
  navigation,
}) => {
  const entrance = useEntranceAnimation(ENTRANCE_GROUPS);
  const [introEntrance, actionsEntrance] = entrance.groups;

  const introStyle = useMemo(
    () => [styles.intro, introEntrance],
    [introEntrance],
  );
  const actionsStyle = useMemo(
    () => [styles.actions, actionsEntrance],
    [actionsEntrance],
  );

  const handleWhatsApp = useCallback(async () => {
    const text = encodeURIComponent(CONTACT_MESSAGE);
    const appUrl = `whatsapp://send?phone=${CONTACT_WA}&text=${text}`;
    const webUrl = `https://wa.me/${CONTACT_WA}?text=${text}`;
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
    } catch {
      Alert.alert(
        'WhatsApp not available',
        `Please message us on WhatsApp at ${CONTACT_NUMBER} to sign up.`,
      );
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Landing's wash blobs, so the screen isn't a blank sheet. */}
      <BrandBackdrop />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={entrance.brand}>
          <BrandHeader onBack={navigation.goBack} testID="signup-brand" />
        </Animated.View>

        <Animated.View style={introStyle}>
          <Text style={styles.title}>Want to sign up?</Text>
          <Text style={styles.subtitle}>
            New driver accounts are set up by our team. Message us on WhatsApp
            and we'll get you on the road.
          </Text>
        </Animated.View>

        <Animated.View style={actionsStyle}>
          <AppButton
            label="Chat on WhatsApp"
            variant="primary"
            fullWidth
            onPress={handleWhatsApp}
            testID="signup-whatsapp"
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const SignUpScreen = React.memo(SignUpScreenComponent);
SignUpScreen.displayName = 'SignUpScreen';
