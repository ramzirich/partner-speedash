import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { LandingScreen } from '../screens/Landing';
import { SignInScreen } from '../screens/SignIn';
import { SignUpScreen } from '../screens/SignUp';
import { ForgotPasswordScreen } from '../screens/ForgotPassword';
import { OtpScreen } from '../screens/Otp';
import { HomeScreen } from '../screens/Home';
import { AppLogo } from '../components/AppLogo';
import { restoreSession, useAppSelector } from '../store';
import { Navigation, RouteEntry, RouteName, RouteParams } from './routes';
import { styles } from './RootNavigator.styles';


const INITIAL_STACK: RouteEntry[] = [{ name: 'Landing', params: undefined }];

export const RootNavigator: React.FC = () => {
  const [stack, setStack] = useState<RouteEntry[]>(INITIAL_STACK);

  const hydrated = useAppSelector(state => state.auth.hydrated);
  const email = useAppSelector(state => state.auth.user?.email);
  const signedIn = useAppSelector(state => state.auth.refreshToken !== null);

  useEffect(() => {
    restoreSession();
  }, []);

  const navigate = useCallback(
    <N extends RouteName>(name: N, params?: RouteParams[N]) => {
      setStack(prev => [...prev, { name, params } as RouteEntry]);
    },
    [],
  );

  const goBack = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(
    <N extends RouteName>(name: N, params?: RouteParams[N]) => {
      setStack([{ name, params } as RouteEntry]);
    },
    [],
  );

  const wasSignedIn = useRef<boolean | null>(null);
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (wasSignedIn.current === signedIn) {
      return;
    }
    wasSignedIn.current = signedIn;
    reset(
      signedIn ? 'Home' : 'Landing',
      signedIn ? { email: email ?? '' } : undefined,
    );
  }, [hydrated, signedIn, email, reset]);

  const current = stack[stack.length - 1];

  const navigation = useMemo<Navigation>(
    () => ({ navigate, goBack, reset, canGoBack: stack.length > 1 }),
    [navigate, goBack, reset, stack.length],
  );

  if (!hydrated) {
    return (
      <View style={styles.splash} testID="root-splash">
        <AppLogo size={112} />
      </View>
    );
  }

  switch (current.name) {
    case 'Landing':
      return <LandingScreen navigation={navigation} params={current.params} />;
    case 'SignIn':
      return <SignInScreen navigation={navigation} params={current.params} />;
    case 'SignUp':
      return <SignUpScreen navigation={navigation} params={current.params} />;
    case 'ForgotPassword':
      return (
        <ForgotPasswordScreen
          navigation={navigation}
          params={current.params}
        />
      );
    case 'Otp':
      return <OtpScreen navigation={navigation} params={current.params} />;
    case 'Home':
      return <HomeScreen navigation={navigation} params={current.params} />;
    default:
      return null;
  }
};

RootNavigator.displayName = 'RootNavigator';
