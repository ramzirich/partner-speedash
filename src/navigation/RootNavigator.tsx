import React, { useCallback, useMemo, useState } from 'react';
import { LandingScreen } from '../screens/Landing';
import { SignInScreen } from '../screens/SignIn';
import { ForgotPasswordScreen } from '../screens/ForgotPassword';
import { OtpScreen } from '../screens/Otp';
import { HomeScreen } from '../screens/Home';
import { Navigation, RouteEntry, RouteName, RouteParams } from './routes';


const INITIAL_STACK: RouteEntry[] = [{ name: 'Landing', params: undefined }];

export const RootNavigator: React.FC = () => {
  const [stack, setStack] = useState<RouteEntry[]>(INITIAL_STACK);

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

  const current = stack[stack.length - 1];

  const navigation = useMemo<Navigation>(
    () => ({ navigate, goBack, reset, canGoBack: stack.length > 1 }),
    [navigate, goBack, reset, stack.length],
  );

  switch (current.name) {
    case 'Landing':
      return <LandingScreen navigation={navigation} params={current.params} />;
    case 'SignIn':
      return <SignInScreen navigation={navigation} params={current.params} />;
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
