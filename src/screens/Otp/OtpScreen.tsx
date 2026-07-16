import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { OtpInput } from '../../components/OtpInput';
import { MotoLoader } from '../../components/MotoLoader';
import { authApi, OTP_LENGTH, toApiError } from '../../api';
import { useIsMounted } from '../../hooks/useIsMounted';
import { ScreenProps } from '../../navigation';
import { styles } from './OtpScreen.styles';

const RESEND_COOLDOWN_SEC = 30;

/**
 * OTP verification step. The code was already requested by the previous screen;
 * here the driver types it in. On success we hand off to Home.
 *
 * Hint for the mock backend: the only accepted code is 123456.
 */
const OtpScreenComponent: React.FC<ScreenProps<'Otp'>> = ({
  navigation,
  params,
}) => {
  const isMounted = useIsMounted();
  const { email } = params;

  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  // `null` = idle; otherwise the label shown in the MotoLoader.
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  // One ticking interval for the screen's lifetime; cleared on unmount so it
  // never fires on a dead component.
  useEffect(() => {
    const id = setInterval(
      () => setCooldown(c => (c > 0 ? c - 1 : 0)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const handleVerify = useCallback(
    async (submitted?: string) => {
      const value = submitted ?? code;
      if (value.length < OTP_LENGTH) {
        setInvalid(true);
        return;
      }
      setInvalid(false);

      setBusyLabel('Verifying your code…');
      try {
        await authApi.verifyOtp({ email, code: value });
        if (!isMounted()) {
          return;
        }
        navigation.reset('Home', { email });
      } catch (error) {
        if (!isMounted()) {
          return;
        }
        setInvalid(true);
        setCode('');
        const apiError = toApiError(error);
        Alert.alert('Verification failed', apiError.userMessage);
      } finally {
        if (isMounted()) {
          setBusyLabel(null);
        }
      }
    },
    [code, email, isMounted, navigation],
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) {
      return;
    }
    setBusyLabel('Sending a new code…');
    try {
      const result = await authApi.requestOtp(email);
      if (!isMounted()) {
        return;
      }
      setCooldown(RESEND_COOLDOWN_SEC);
      setCode('');
      setInvalid(false);
      Alert.alert('Code sent', `We sent a new code to ${result.sentTo}.`);
    } catch (error) {
      if (!isMounted()) {
        return;
      }
      const apiError = toApiError(error);
      Alert.alert('Could not resend code', apiError.userMessage);
    } finally {
      if (isMounted()) {
        setBusyLabel(null);
      }
    }
  }, [cooldown, email, isMounted]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              onPress={navigation.goBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>Verify it's you</Text>
            <Text style={styles.subtitle}>
              Enter the {OTP_LENGTH}-digit code we sent to{' '}
              <Text style={styles.emailHighlight}>{email}</Text>.
            </Text>
          </View>

          <View style={styles.form}>
            <OtpInput
              value={code}
              onChangeText={setCode}
              length={OTP_LENGTH}
              error={invalid}
              autoFocus
              onComplete={handleVerify}
              testID="otp-input"
            />
            {invalid ? (
              <Text style={styles.errorText}>
                That code isn't right. Check it and try again.
              </Text>
            ) : null}

            <View style={styles.resendRow}>
              <Text style={styles.resendHint}>Didn't get a code?</Text>
              <Pressable
                onPress={handleResend}
                disabled={cooldown > 0}
                hitSlop={8}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.resendLink,
                    cooldown > 0 && styles.resendDisabled,
                  ]}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Verify"
              variant="primary"
              fullWidth
              onPress={() => handleVerify()}
              loading={busyLabel === 'Verifying your code…'}
              disabled={code.length < OTP_LENGTH}
              testID="otp-submit"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MotoLoader visible={busyLabel !== null} label={busyLabel ?? ''} />
    </SafeAreaView>
  );
};

export const OtpScreen = React.memo(OtpScreenComponent);
OtpScreen.displayName = 'OtpScreen';
