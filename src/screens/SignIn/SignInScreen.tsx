import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { AppDialog } from '../../components/AppDialog';
import { AppTextField } from '../../components/AppTextField';
import { BrandBackdrop } from '../../components/BrandBackdrop';
import { BrandHeader } from '../../components/BrandHeader';
import { InlineAlert } from '../../components/InlineAlert';
import { MotoLoader } from '../../components/MotoLoader';
import { authApi, toApiError } from '../../api';
import type { ApiErrorCode } from '../../api';
import { useAppDispatch, setCredentials } from '../../store';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { useIsMounted } from '../../hooks/useIsMounted';
import { validateEmail, validatePassword } from '../../utils/validation';
import { ScreenProps } from '../../navigation';
import { styles } from './SignInScreen.styles';

/** Content groups that stagger in after the brand mark: intro, form, actions. */
const ENTRANCE_GROUPS = 3;

const isCredentialFailure = (code: ApiErrorCode): boolean =>
  code === 'UNAUTHORIZED';

/** How long the inline rejection sits under the password field before fading. */
const ERROR_VISIBLE_MS = 4000;

const SignInScreenComponent: React.FC<ScreenProps<'SignIn'>> = ({
  navigation,
}) => {
  const isMounted = useIsMounted();
  const dispatch = useAppDispatch();
  const passwordRef = useRef<TextInput>(null);
  const entrance = useEntranceAnimation(ENTRANCE_GROUPS);
  const [introEntrance, formEntrance, actionsEntrance] = entrance.groups;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorContent, setErrorContent] = useState({ title: '', message: '' });

  useEffect(() => {
    if (!formError || loading) {
      return;
    }
    passwordRef.current?.focus();
    const timerId = setTimeout(() => setFormError(''), ERROR_VISIBLE_MS);
    return () => clearTimeout(timerId);
  }, [formError, loading]);

  const handleSubmit = useCallback(async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }
    setErrors({});
    setFormError('');

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
      if (isCredentialFailure(apiError.code)) {
        setFormError(apiError.userMessage);
      } else {
        setErrorContent({
          title: 'Could not sign in',
          message: apiError.userMessage,
        });
        setErrorVisible(true);
      }
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
    setFormError('');
    setErrors(prev =>
      prev.email ? { ...prev, email: validateEmail(text) } : prev,
    );
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setFormError('');
    setErrors(prev =>
      prev.password ? { ...prev, password: validatePassword(text) } : prev,
    );
  }, []);

  const dismissError = useCallback(() => setErrorVisible(false), []);

  // Memoized so the entrance groups don't re-allocate a style array on every
  // keystroke — the screen re-renders on each character typed.
  const introStyle = useMemo(
    () => [styles.intro, introEntrance],
    [introEntrance],
  );
  const formStyle = useMemo(() => [styles.form, formEntrance], [formEntrance]);
  const actionsStyle = useMemo(
    () => [styles.actions, actionsEntrance],
    [actionsEntrance],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Landing's wash blobs, so the screen isn't a blank sheet. */}
      <BrandBackdrop />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={entrance.brand}>
            <BrandHeader onBack={navigation.goBack} testID="signin-brand" />
          </Animated.View>

          <Animated.View style={introStyle}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to start accepting deliveries and tracking your earnings.
            </Text>
          </Animated.View>

          <Animated.View style={formStyle}>
            <AppTextField
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              error={errors.email}
              placeholder="you@example.com"
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              importantForAutofill="yes"
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
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              importantForAutofill="yes"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              testID="signin-password"
            />
            {/* Sits directly under the password field — where the fix happens —
                and retires itself after ERROR_VISIBLE_MS. */}
            <InlineAlert
              message={formError}
              tone="danger"
              testID="signin-form-error"
            />
            {/* <Pressable
              onPress={goToForgot}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.forgotRow}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable> */}
          </Animated.View>

          <Animated.View style={actionsStyle}>
            <AppButton
              label="Sign In"
              variant="primary"
              fullWidth
              onPress={handleSubmit}
              loading={loading}
              testID="signin-submit"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MotoLoader visible={loading} label="Signing you in…" />

      <AppDialog
        visible={errorVisible}
        title={errorContent.title}
        message={errorContent.message}
        tone="danger"
        onConfirm={dismissError}
        testID="signin-error"
      />
    </SafeAreaView>
  );
};

export const SignInScreen = React.memo(SignInScreenComponent);
SignInScreen.displayName = 'SignInScreen';
