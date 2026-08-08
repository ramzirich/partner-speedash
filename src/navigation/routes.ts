export type RouteName =
  | 'Landing'
  | 'SignIn'
  | 'SignUp'
  | 'ForgotPassword'
  | 'Otp'
  | 'Home';

export interface RouteParams {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  Home: { email: string };
}

export type RouteEntry = {
  [N in RouteName]: { name: N; params: RouteParams[N] };
}[RouteName];

export interface Navigation {
  /** Push a new screen onto the stack. */
  navigate: <N extends RouteName>(name: N, params?: RouteParams[N]) => void;
  /** Pop the current screen (no-op if already at the root). */
  goBack: () => void;
  /** Replace the whole stack with a single screen (e.g. after sign-in). */
  reset: <N extends RouteName>(name: N, params?: RouteParams[N]) => void;
  /** Whether a back action is currently possible. */
  canGoBack: boolean;
}

export interface ScreenProps<N extends RouteName> {
  navigation: Navigation;
  params: RouteParams[N];
}
