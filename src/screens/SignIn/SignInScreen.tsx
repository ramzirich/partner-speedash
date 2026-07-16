import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { AppTextField } from '../../components/AppTextField';
import { MotoLoader } from '../../components/MotoLoader';
import { authApi, toApiError } from '../../api';
import { useAppDispatch, setCredentials } from '../../store';
import { useIsMounted } from '../../hooks/useIsMounted';
import { validateEmail, validatePassword } from '../../utils/validation';
import { ScreenProps } from '../../navigation';
import { styles } from './SignInScreen.styles';

/**
 * Sign-in form: email + password → Home on success.
 *
 * Notes:
 *  - `useIsMounted` guards every post-await setState (the screen can be popped
 *    mid-request).
 *  - The MotoLoader overlay blocks the form while the (mock) API call runs.
 *  - On success we `reset` to Home so Back doesn't return to the login form.
 */
const SignInScreenComponent: React.FC<ScreenProps<'SignIn'>> = ({
  navigation,
}) => {
  const isMounted = useIsMounted();
  const dispatch = useAppDispatch();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const result = await authApi.signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!isMounted()) {
        return;
      }
      dispatch(setCredentials(result));
      navigation.reset('Home', { email: result.user.email });
    } catch (error) {
      if (!isMounted()) {
        return;
      }
      const apiError = toApiError(error);
      Alert.alert('Could not sign in', apiError.userMessage);
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [email, password, isMounted, navigation, dispatch]);

  const handleEmailBlur = useCallback(() => {
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
  }, [email]);

  const handlePasswordBlur = useCallback(() => {
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  }, [password]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    setErrors(prev =>
      prev.email ? { ...prev, email: validateEmail(text) } : prev,
    );
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setErrors(prev =>
      prev.password ? { ...prev, password: validatePassword(text) } : prev,
    );
  }, []);

  const goToForgot = useCallback(
    () => navigation.navigate('ForgotPassword'),
    [navigation],
  );

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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to start accepting deliveries and tracking your earnings.
            </Text>
          </View>

          <View style={styles.form}>
            <AppTextField
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              error={errors.email}
              placeholder="you@example.com"
              // `visible-password` is the Android trick that hard-disables the
              // suggestion strip + autofill dropdown while keeping a normal
              // QWERTY keyboard — so tapping shows the keyboard and nothing else.
              keyboardType="visible-password"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              testID="signin-email"
            />
            <AppTextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={errors.password}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              testID="signin-password"
            />
            <Pressable
              onPress={goToForgot}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Sign In"
              variant="primary"
              fullWidth
              onPress={handleSubmit}
              loading={loading}
              testID="signin-submit"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MotoLoader visible={loading} label="Signing you in…" />
    </SafeAreaView>
  );
};

export const SignInScreen = React.memo(SignInScreenComponent);
SignInScreen.displayName = 'SignInScreen';
