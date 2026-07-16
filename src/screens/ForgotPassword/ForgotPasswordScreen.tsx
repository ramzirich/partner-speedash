import React, { useCallback, useState } from 'react';
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
import { AppTextField } from '../../components/AppTextField';
import { MotoLoader } from '../../components/MotoLoader';
import { authApi, toApiError } from '../../api';
import { useIsMounted } from '../../hooks/useIsMounted';
import { validateEmail } from '../../utils/validation';
import { ScreenProps } from '../../navigation';
import { styles } from './ForgotPasswordScreen.styles';

/**
 * Forgot-password step 1: collect the email, request a one-time code, then move
 * on to the OTP screen. The actual code entry/verification happens there.
 */
const ForgotPasswordScreenComponent: React.FC<ScreenProps<'ForgotPassword'>> = ({
  navigation,
}) => {
  const isMounted = useIsMounted();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError(undefined);

    setLoading(true);
    try {
      const trimmed = email.trim();
      await authApi.requestOtp(trimmed);
      if (!isMounted()) {
        return;
      }
      // Carry the email forward so the OTP screen knows who's verifying.
      navigation.navigate('Otp', { email: trimmed });
    } catch (err) {
      if (!isMounted()) {
        return;
      }
      const apiError = toApiError(err);
      Alert.alert('Could not send code', apiError.userMessage);
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [email, isMounted, navigation]);

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
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter the email tied to your account and we'll send you a
              verification code to reset it.
            </Text>
          </View>

          <View style={styles.form}>
            <AppTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={error}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="send"
              onSubmitEditing={handleConfirm}
              testID="forgot-email"
            />
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Confirm"
              variant="primary"
              fullWidth
              onPress={handleConfirm}
              loading={loading}
              testID="forgot-submit"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MotoLoader visible={loading} label="Sending your code…" />
    </SafeAreaView>
  );
};

export const ForgotPasswordScreen = React.memo(ForgotPasswordScreenComponent);
ForgotPasswordScreen.displayName = 'ForgotPasswordScreen';
