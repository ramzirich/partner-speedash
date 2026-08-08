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
import {
  addDays,
  formatDateRange,
  todayDateString,
} from '../../components/CalendarDatePicker';
import type { DateRange } from '../../components/CalendarDatePicker';
import { InlineAlert } from '../../components/InlineAlert';
import { MotoLoader } from '../../components/MotoLoader';
import {
  Order,
  OrderProgress,
  OrderStatus,
  orderStepName,
} from '../../components/OrderCard';
import { OrderOfferBanner } from '../../components/OrderOfferBanner';
import { WorkStatusToggle } from '../../components/WorkStatusToggle';
import { authApi, ordersApi, toApiError, toDayUnix } from '../../api';
import type { DriverNotification } from '../../api';
import { useBackgroundLocation } from '../../hooks/useBackgroundLocation';
import { useDriverOffers } from '../../hooks/useDriverOffers';
import { useDriverSocket } from '../../hooks/useDriverSocket';
import { useIsMounted } from '../../hooks/useIsMounted';
import { useWorkStatus } from '../../hooks/useWorkStatus';
import { useAppDispatch, useAppSelector, logout } from '../../store';
import { ScreenProps } from '../../navigation';
import { colors } from '../../theme';
import { HomeTab } from './HomeTab';
import { OrdersTab } from './OrdersTab';
import { TabBarButton } from './TabBarButton';
import { useHomeAnimation } from './useHomeAnimation';
import type { ContentKey } from './types';
import { styles } from './HomeScreen.styles';

const DEFAULT_REGION = { latitude: 33.8938, longitude: 35.5018 };

const defaultRange = (): DateRange => {
  const today = todayDateString();
  return { start: addDays(today, -1), end: today };
};

const FALLBACK_CURRENCY = 'USD';

/** Mock processing time for accept/decline (replace with the API call). */
const PROCESS_DELAY_MS = 1800;

const LOGOUT_ICON_SIZE = 20;

/** Sign-in's waiting overlay, worded for the step the driver just picked. */
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
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
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
 * bottom bar itself. Orders state lives here (not in OrdersTab) so the pending
 * count can badge the Orders button and survive tab switches.
 */
const HomeScreenComponent: React.FC<ScreenProps<'Home'>> = ({ navigation }) => {
  const isMounted = useIsMounted();
  const dispatch = useAppDispatch();
  const firstName = useAppSelector(state => state.auth.user?.firstName);
  const driverId = useAppSelector(state => state.auth.user?.id);
  const refreshToken = useAppSelector(state => state.auth.refreshToken);
  const animated = useHomeAnimation();

  const [activeKey, setActiveKey] = useState<ContentKey>('home');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const greeting = getGreeting();
  const displayName = firstName ? capitalize(firstName) : 'Driver';

  const {
    status: workStatus,
    pending: workStatusPending,
    error: workStatusError,
    setOnline,
  } = useWorkStatus();
  // The socket follows the toggle above: it dials once the server confirms
  // ONLINE and closes on OFFLINE or sign-out. Declared before the two hooks that
  // use it so the connection is up before either subscribes or emits, and after
  // the status so neither asserts ONLINE on the driver's behalf.
  const online = useDriverSocket(driverId, workStatus);
  const { position } = useBackgroundLocation(driverId, workStatus);
  const {
    offers,
    offerIds,
    alert: offerAlert,
    dismissAlert,
    notificationSeq,
  } = useDriverOffers(driverId, online);
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  /** Kept apart from `processingLabel` so accept/decline's timer can't clear it. */
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ordersRequestRef = useRef(0);
  const handledSeqRef = useRef(0);

  const latitude = position?.latitude ?? DEFAULT_REGION.latitude;
  const longitude = position?.longitude ?? DEFAULT_REGION.longitude;

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
   * tabs (the summary counts the same orders the list shows). Every call takes a
   * ticket so a slow earlier response can never overwrite a newer one, and
   * `silent` skips the spinner for background refetches (the list on screen
   * stays put until fresh data lands).
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

  // Initial load, and again whenever the driver picks a different range —
  // `refreshOrders` is keyed to it.
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  /**
   * A pushed notification makes both tabs stale, so refetch wherever the driver
   * is standing. The seq guard keeps it to one fetch per notification even
   * though this effect also re-runs when the range changes.
   */
  useEffect(() => {
    if (notificationSeq === handledSeqRef.current) {
      return;
    }
    handledSeqRef.current = notificationSeq;
    refreshOrders(true);
  }, [notificationSeq, refreshOrders]);

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
        // Answering an order moves it between the summary's buckets — pull the
        // server's version so both tabs agree on what just happened.
        refreshOrders(true);
      }, PROCESS_DELAY_MS);
    },
    [isMounted, refreshOrders],
  );

  // Socket-pushed offers: the backend has no accept/reject route yet (the service
  // methods exist but aren't exposed over HTTP), so responding is a log for now.
  const handleAccept = useCallback(
    (order: Order) => {
      if (offerIds.has(order.id)) {
        console.log(`[order] accept ${order.id}`);
        refreshOrders(true);
        return;
      }
      resolveOrder(order.id, 'on_delivery', 'Accepting order…');
    },
    [offerIds, resolveOrder, refreshOrders],
  );

  const handleDecline = useCallback(
    (order: Order) => {
      if (offerIds.has(order.id)) {
        console.log(`[order] reject ${order.id}`);
        refreshOrders(true);
        return;
      }
      resolveOrder(order.id, 'rejected', 'Rejecting order…');
    },
    [offerIds, resolveOrder, refreshOrders],
  );

  /**
   * Advance a live order one step (ASSIGNED → HEADING_TO_PARTNER → AT_PICKUP →
   * HEADING_TO_CUSTOMER → DELIVERED). The card only ever offers the one legal
   * move, so this just forwards it to `PATCH /orders/:id/status` and swaps in
   * whatever the server says the order now is.
   *
   * The rider overlay covers the whole round trip — the PATCH *and* the refetch
   * behind it — so the list the driver sees when it lifts is the fresh one.
   */
  const handleAdvanceStatus = useCallback(
    async (order: Order, next: OrderProgress): Promise<void> => {
      if (!driverId) {
        setOrdersError('We could not identify your driver account.');
        return;
      }
      setUpdatingOrderId(order.id);
      setStatusLabel(statusWaitLabel(next));
      try {
        const updated = await ordersApi.updateStatus({
          orderId: order.id,
          driverId,
          newStatus: next,
        });
        if (!isMounted()) {
          return;
        }
        if (updated) {
          setOrders(prev =>
            prev.map(o => (o.id === updated.id ? updated : o)),
          );
        }
        setOrdersError(null);
        // The response only covers this order — a silent refetch also picks up
        // whatever else the transition changed server-side. Awaited (it never
        // rejects; it reports through `ordersError`) so the overlay outlives it.
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
    [driverId, isMounted, refreshOrders],
  );

  /**
   * Tapping the notification opens the Orders tab on that order's card. The
   * refetch is handled by the effect above: switching to `orders` with an
   * unhandled seq is exactly the case it waits for.
   */
  const handleOpenOffer = useCallback(
    (notification: DriverNotification) => {
      setFocusOrderId(notification.orderId);
      setActiveKey('orders');
      dismissAlert();
    },
    [dismissAlert],
  );

  // Offers first (they're the actionable ones), then the fetched day's orders
  // with any duplicate of an offer dropped.
  const visibleOrders = useMemo(
    () => [...offers, ...orders.filter(order => !offerIds.has(order.id))],
    [offers, orders, offerIds],
  );

  /** The summary sheet counts exactly what the Orders tab lists. */
  const stats = useMemo(() => {
    const counts = {
      total: visibleOrders.length,
      done: 0,
      pending: 0,
      rejected: 0,
    };
    visibleOrders.forEach(order => {
      if (order.status === 'done') {
        counts.done += 1;
      } else if (order.status === 'pending') {
        counts.pending += 1;
      } else if (order.status === 'rejected') {
        counts.rejected += 1;
      }
    });
    return counts;
  }, [visibleOrders]);

  /** Only delivered orders have actually paid, so only they are counted. */
  const earnings = useMemo(() => {
    const paid = visibleOrders.filter(order => order.status === 'done');
    return {
      amount: paid.reduce((sum, order) => sum + (order.amount ?? 0), 0),
      currency: paid[0]?.currency ?? FALLBACK_CURRENCY,
    };
  }, [visibleOrders]);

  const periodLabel = useMemo(() => formatDateRange(range), [range]);

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

  const handleTabPress = useCallback((key: ContentKey) => setActiveKey(key), []);

  /**
   * The badge counts everything still on the driver's plate — offers waiting on
   * an answer *and* deliveries already under way. Only done and rejected orders
   * drop out of it.
   */
  const openCount = visibleOrders.filter(
    o => o.status !== 'done' && o.status !== 'rejected',
  ).length;

  const headerStyle = useMemo(
    () => [styles.header, animated.header],
    [animated.header],
  );
  const logoutButtonStyle = useMemo(
    () =>
      (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
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
  const workStatusAlertStyle = useMemo(
    () => [styles.statusAlert, workStatusError ? styles.statusAlertActive : null],
    [workStatusError],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar: time-based greeting + driver name, on/off-duty switch on the
          right. */}
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

        <WorkStatusToggle
          status={workStatus}
          pending={workStatusPending}
          onChange={setOnline}
        />

        {/* Sign-out lives here now that there is no Profile tab. The confirm
            dialog in `handleLogout` is what protects the tap. */}
        <Pressable
          style={logoutButtonStyle}
          onPress={handleLogout}
          disabled={loggingOut}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
          testID="home-logout">
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

      {/* The toggle above shows the status the server confirmed; this says why
          it isn't what the driver expected — a failed read on arrival, or a
          rejected switch. */}
      <View style={workStatusAlertStyle}>
        <InlineAlert
          message={workStatusError ?? ''}
          tone="warning"
          testID="home-work-status-error"
        />
      </View>

      {/* Content switches with the active bottom button. */}
      <View style={styles.content}>
        {/* Socket-pushed order notification, floating over the content. */}
        <OrderOfferBanner
          notification={offerAlert?.notification ?? null}
          expiresAt={offerAlert?.expiresAt ?? null}
          onPress={handleOpenOffer}
          onDismiss={dismissAlert}
        />

        {activeKey === 'home' ? (
          <HomeTab
            latitude={latitude}
            longitude={longitude}
            hasFix={position !== null}
            stats={stats}
            earnings={earnings}
            periodLabel={periodLabel}
          />
        ) : (
          <OrdersTab
            orders={visibleOrders}
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

      {/* Sign-in's rider overlay, reused for anything the driver has to wait on:
          accept/decline, and a status change with its refetch. */}
      <Modal
        visible={waitLabel !== null}
        transparent
        animationType="fade"
        statusBarTranslucent>
        <MotoLoader visible label={waitLabel ?? ''} />
      </Modal>

      <AppDialog
        visible={logoutVisible}
        title="Log out"
        message="You'll need to sign in again to accept deliveries."
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
