export type RouteName =
  | 'Landing'
  | 'SignIn'
  | 'ForgotPassword'
  | 'Otp'
  | 'Home';

export interface RouteParams {
  Landing: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  Home: { email: string };
}

/**
 * A single entry on the navigation stack. Written as a distributive union so
 * `switch (entry.name)` narrows `entry.params` to the matching route's params.
 */
export type RouteEntry = {
  [N in RouteName]: { name: N; params: RouteParams[N] };
}[RouteName];

/**
 * Navigation API handed to every screen. Mirrors React Navigation's surface so
 * a future migration is mechanical.
 */
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

/** Props every screen component receives from `RootNavigator`. */
export interface ScreenProps<N extends RouteName> {
  navigation: Navigation;
  params: RouteParams[N];
}
