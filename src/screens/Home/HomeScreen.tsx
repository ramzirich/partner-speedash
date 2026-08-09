import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  PressableStateCallbackType,
  StatusBar,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppDialog } from '../../components/AppDialog';
import { addDays, todayDateString } from '../../components/CalendarDatePicker';
import type { DateRange } from '../../components/CalendarDatePicker';
import { MotoLoader } from '../../components/MotoLoader';
import {
  Order,
  OrderProgress,
  OrderStatus,
  orderStepName,
} from '../../components/OrderCard';
import { authApi, ordersApi, toApiError, toDayUnix } from '../../api';
import { useDriverSocket } from '../../hooks/useDriverSocket';
import { useIsMounted } from '../../hooks/useIsMounted';
import { useAppDispatch, useAppSelector, logout } from '../../store';
import { ScreenProps } from '../../navigation';
import { colors } from '../../theme';
import { CreateOrderTab } from './CreateOrderTab';
import { OrdersTab } from './OrdersTab';
import { TabBarButton } from './TabBarButton';
import { useHomeAnimation } from './useHomeAnimation';
import type { ContentKey } from './types';
import { styles } from './HomeScreen.styles';

const LOGOUT_ICON_SIZE = 20;

/** The rolling window the create pane's summary line counts over. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Yesterday → today. Two calendar days because the history endpoint rounds its
 * bounds out to whole UTC days — it's the smallest request guaranteed to
 * contain the last 24 hours.
 */
const defaultRange = (): DateRange => {
  const today = todayDateString();
  return { start: addDays(today, -1), end: today };
};

/** Mock processing time for accept/decline (replace with the API call). */
const PROCESS_DELAY_MS = 1800;

/** Sign-in's waiting overlay, worded for the step just picked. */
const statusWaitLabel = (next: OrderProgress): string =>
  next === 'DELIVERED'
    ? 'Marking this order delivered…'
    : `Moving you to ${orderStepName(next).toLowerCase()}…`;

const TABS: ReadonlyArray<{
  key: ContentKey;
  label: string;
  icon: string;
  iconActive: string;
}> = [
  {
    key: 'home',
    label: 'New order',
    icon: 'add-circle-outline',
    iconActive: 'add-circle',
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: 'receipt-outline',
    iconActive: 'receipt',
  },
];

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 19 || hour < 5) {
    return 'Good evening';
  }
  if (hour < 12) {
    return 'Good morning';
  }
  return 'Good afternoon';
};

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Home shell: a content area that swaps with the active bottom button, plus the
 * bottom bar itself. Orders state lives here (not in OrdersTab) so the open
 * count can badge the Orders button and survive tab switches — and so the
 * create pane can refetch into the same list after raising an order.
 */
const HomeScreenComponent: React.FC<ScreenProps<'Home'>> = ({ navigation }) => {
  const isMounted = useIsMounted();
  const dispatch = useAppDispatch();
  const firstName = useAppSelector(state => state.auth.user?.firstName);
  const partnerId = useAppSelector(state => state.auth.user?.id);
  const refreshToken = useAppSelector(state => state.auth.refreshToken);
  const animated = useHomeAnimation();

  const [activeKey, setActiveKey] = useState<ContentKey>('home');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const greeting = getGreeting();
  const displayName = firstName ? capitalize(firstName) : 'Partner';

  // The socket follows the session: it dials for a signed-in partner and closes
  // on sign-out. Nothing subscribes to it yet.
  useDriverSocket(partnerId);

  const [range, setRange] = useState<DateRange>(defaultRange);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  /** Kept apart from `processingLabel` so accept/decline's timer can't clear it. */
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [focusOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ordersRequestRef = useRef(0);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  /**
   * `POST /api/order/history` for the selected days — the one fetch behind both
   * tabs. Every call takes a ticket so a slow earlier response can never
   * overwrite a newer one, and `silent` skips the spinner for background
   * refetches (the list on screen stays put until fresh data lands).
   */
  const refreshOrders = useCallback(
    async (silent = false): Promise<void> => {
      const requestId = ordersRequestRef.current + 1;
      ordersRequestRef.current = requestId;
      if (!silent) {
        setOrdersLoading(true);
      }
      const isCurrent = (): boolean =>
        requestId === ordersRequestRef.current && isMounted();
      try {
        const list = await ordersApi.history({
          startDateUnix: toDayUnix(range.start),
          endDateUnix: toDayUnix(range.end),
        });
        if (isCurrent()) {
          setOrders(list);
          setOrdersError(null);
        }
      } catch (err) {
        if (isCurrent()) {
          setOrdersError(toApiError(err).userMessage);
        }
      } finally {
        if (isCurrent()) {
          setOrdersLoading(false);
        }
      }
    },
    [isMounted, range.start, range.end],
  );

  // Initial load, and again whenever the partner picks a different range —
  // `refreshOrders` is keyed to it.
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  /** A new order belongs to the fetched window — pull the server's version. */
  const handleOrderCreated = useCallback(() => {
    refreshOrders(true);
  }, [refreshOrders]);

  const resolveOrder = useCallback(
    (id: string, nextStatus: OrderStatus, label: string) => {
      setProcessingLabel(label);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Stand-in for the real accept/decline API call.
      timerRef.current = setTimeout(() => {
        if (!isMounted()) {
          return;
        }
        setOrders(prev =>
          prev.map(o => (o.id === id ? { ...o, status: nextStatus } : o)),
        );
        setProcessingLabel(null);
        refreshOrders(true);
      }, PROCESS_DELAY_MS);
    },
    [isMounted, refreshOrders],
  );

  const handleAccept = useCallback(
    (order: Order) => resolveOrder(order.id, 'on_delivery', 'Accepting order…'),
    [resolveOrder],
  );

  const handleDecline = useCallback(
    (order: Order) => resolveOrder(order.id, 'rejected', 'Rejecting order…'),
    [resolveOrder],
  );

  /**
   * Advance a live order one step (ASSIGNED → HEADING_TO_PARTNER → AT_PICKUP →
   * HEADING_TO_CUSTOMER → DELIVERED). The card only ever offers the one legal
   * move, so this forwards it to `PATCH /orders/:id/status` and swaps in
   * whatever the server says the order now is. The overlay covers the whole
   * round trip — the PATCH *and* the refetch behind it.
   */
  const handleAdvanceStatus = useCallback(
    async (order: Order, next: OrderProgress): Promise<void> => {
      if (!partnerId) {
        setOrdersError('We could not identify your partner account.');
        return;
      }
      setUpdatingOrderId(order.id);
      setStatusLabel(statusWaitLabel(next));
      try {
        const updated = await ordersApi.updateStatus({
          orderId: order.id,
          partnerId,
          newStatus: next,
        });
        if (!isMounted()) {
          return;
        }
        if (updated) {
          setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
        }
        setOrdersError(null);
        // The response only covers this order — a silent refetch also picks up
        // whatever else the transition changed server-side.
        await refreshOrders(true);
      } catch (err) {
        if (isMounted()) {
          setOrdersError(toApiError(err).userMessage);
        }
      } finally {
        if (isMounted()) {
          setUpdatingOrderId(null);
          setStatusLabel(null);
        }
      }
    },
    [partnerId, isMounted, refreshOrders],
  );

  /**
   * The create pane's one line about the history: how many orders were raised
   * in the last 24 hours. The window is applied here, not in the request — the
   * endpoint widens whatever bounds it's given to whole UTC days, so the fetch
   * pulls two of them and this trims it back to a rolling day. An order with no
   * timestamp can't be placed in the window, so it doesn't count.
   */
  const recentCount = useMemo(() => {
    const cutoff = Date.now() - DAY_MS;
    return orders.filter(order => (order.createdAt ?? 0) >= cutoff).length;
  }, [orders]);

  const ordersSummary = useMemo(() => {
    if (ordersError) {
      return ordersError;
    }
    if (ordersLoading) {
      return 'Loading recent orders…';
    }
    return `${recentCount} ${
      recentCount === 1 ? 'order' : 'orders'
    } in the last 24 hours`;
  }, [ordersError, ordersLoading, recentCount]);

  /** Whichever wait is in flight owns the overlay; only one runs at a time. */
  const waitLabel = processingLabel ?? statusLabel;

  const handleLogout = useCallback(() => setLogoutVisible(true), []);

  const handleLogoutCancel = useCallback(() => setLogoutVisible(false), []);

  const handleLogoutConfirm = useCallback(async () => {
    setLoggingOut(true);
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken, allDevices: false });
      }
    } catch {
      // Ignore — the local sign-out below must always succeed.
    }
    // The screen is about to be torn down by the reset, but the dialog and the
    // spinner are still mounted right now — don't setState if it isn't.
    if (!isMounted()) {
      return;
    }
    setLogoutVisible(false);
    setLoggingOut(false);
    dispatch(logout());
    navigation.reset('Landing');
  }, [refreshToken, dispatch, navigation, isMounted]);

  const handleTabPress = useCallback(
    (key: ContentKey) => setActiveKey(key),
    [],
  );

  /**
   * The badge counts everything still on the partner's plate — orders waiting
   * on a driver *and* deliveries already under way. Only done and rejected
   * orders drop out of it.
   */
  const openCount = orders.filter(
    o => o.status !== 'done' && o.status !== 'rejected',
  ).length;

  const headerStyle = useMemo(
    () => [styles.header, animated.header],
    [animated.header],
  );
  const logoutButtonStyle = useMemo(
    () =>
      (state: PressableStateCallbackType): StyleProp<ViewStyle> =>
        [
          styles.logoutButton,
          state.pressed && styles.logoutButtonPressed,
          loggingOut && styles.logoutButtonPressed,
        ],
    [loggingOut],
  );
  const tabBarStyle = useMemo(
    () => [styles.tabBar, animated.tabBar],
    [animated.tabBar],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar: time-based greeting + partner name, sign-out on the right. */}
      <Animated.View style={headerStyle}>
        <View pointerEvents="none" style={styles.headerBackdrop}>
          <View style={styles.headerBlob} />
          <View style={styles.headerAccent} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.greetingLabel}>{greeting},</Text>
          <Text style={styles.greetingName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <Pressable
          style={logoutButtonStyle}
          onPress={handleLogout}
          disabled={loggingOut}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
          testID="home-logout"
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={LOGOUT_ICON_SIZE}
              color={colors.danger}
            />
          )}
        </Pressable>
      </Animated.View>

      {/* Content switches with the active bottom button. */}
      <View style={styles.content}>
        {activeKey === 'home' ? (
          <CreateOrderTab
            partnerId={partnerId}
            summary={ordersSummary}
            summaryIsError={ordersError !== null}
            onCreated={handleOrderCreated}
          />
        ) : (
          <OrdersTab
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            focusOrderId={focusOrderId}
            updatingOrderId={updatingOrderId}
            range={range}
            onRangeChange={setRange}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onAdvanceStatus={handleAdvanceStatus}
          />
        )}
      </View>

      {/* Bottom bar */}
      <Animated.View style={tabBarStyle} accessibilityRole="tablist">
        {TABS.map(tab => (
          <TabBarButton
            key={tab.key}
            tabKey={tab.key}
            label={tab.label}
            icon={tab.icon}
            iconActive={tab.iconActive}
            active={tab.key === activeKey}
            badge={tab.key === 'orders' ? openCount : 0}
            onPress={handleTabPress}
          />
        ))}
      </Animated.View>

      {/* Sign-in's rider overlay, reused for anything worth waiting on:
          accept/decline, and a status change with its refetch. */}
      <Modal
        visible={waitLabel !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <MotoLoader visible label={waitLabel ?? ''} />
      </Modal>

      <AppDialog
        visible={logoutVisible}
        title="Log out"
        message="You'll need to sign in again to create orders."
        tone="danger"
        confirmLabel="Log out"
        confirmLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        cancelLabel="Cancel"
        onCancel={handleLogoutCancel}
        testID="home-logout-dialog"
      />
    </SafeAreaView>
  );
};

export const HomeScreen = React.memo(HomeScreenComponent);
HomeScreen.displayName = 'HomeScreen';
