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
  AppState,
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
import type { Order } from '../../components/OrderCard';
import {
  authApi,
  isSocketConnected,
  onSocketStatus,
  ordersApi,
  resyncSocket,
  toApiError,
  toDayUnix,
} from '../../api';
import type { OrderDocument, OrderDocumentStatus } from '../../api';
import { useDriverSocket } from '../../hooks/useDriverSocket';
import { refreshDropoffZones } from '../../hooks/useDropoffZones';
import { useIsMounted } from '../../hooks/useIsMounted';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import {
  initOrderNotifications,
  onOrderNotificationPress,
  startNotificationPressRouting,
} from '../../services/notifications';
import {
  announceOrderStatus,
  startBackgroundOrderNotifications,
  stopBackgroundOrderNotifications,
} from '../../services/backgroundOrders';
import { recordOrderStatusTime } from '../../services/orderStatusTimes';
import {
  registerForPush,
  startPushRouting,
  unregisterFromPush,
} from '../../services/push';
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

const DAY_MS = 24 * 60 * 60 * 1000;

const defaultRange = (): DateRange => {
  const today = todayDateString();
  return { start: addDays(today, -1), end: today };
};

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

const HomeScreenComponent: React.FC<ScreenProps<'Home'>> = ({ navigation }) => {
  const isMounted = useIsMounted();
  const dispatch = useAppDispatch();
  const businessName = useAppSelector(state => state.auth.user?.businessName);
  const firstName = useAppSelector(state => state.auth.user?.firstName);
  const partnerId = useAppSelector(state => state.auth.user?.id);
  const refreshToken = useAppSelector(state => state.auth.refreshToken);
  const animated = useHomeAnimation();

  const [activeKey, setActiveKey] = useState<ContentKey>('home');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const greeting = getGreeting();
  const displayName =
    capitalize(businessName?.trim() ?? '') ||
    (firstName ? capitalize(firstName) : 'Partner');

  useDriverSocket(partnerId);

  useEffect(() => {
    initOrderNotifications();
    startNotificationPressRouting();
    startPushRouting();
    registerForPush();
  }, []);

  const [range, setRange] = useState<DateRange>(defaultRange);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState('');
  const ordersRequestRef = useRef(0);

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

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([refreshOrders(true), refreshDropoffZones()]);
    if (isMounted()) {
      setRefreshing(false);
    }
  }, [refreshOrders, isMounted]);

  const handleOrderCreated = useCallback(() => {
    refreshOrders(true);
  }, [refreshOrders]);

  useEffect(() => {
    return onOrderNotificationPress(orderId => {
      setActiveKey('orders');
      setFocusOrderId(orderId);
      refreshOrders(true);
    });
  }, [refreshOrders]);

  const handleTrackedStatusChange = useCallback(
    (_status: OrderDocumentStatus, order: OrderDocument) => {
      refreshOrders(true);
      announceOrderStatus(order);
    },
    [refreshOrders],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        resyncSocket();
        refreshOrders(true);
      }
    });
    return () => subscription.remove();
  }, [refreshOrders]);

  const wasConnectedRef = useRef(isSocketConnected());

  useEffect(
    () =>
      onSocketStatus(connected => {
        const reconnected = connected && !wasConnectedRef.current;
        wasConnectedRef.current = connected;
        if (reconnected) {
          refreshOrders(true);
        }
      }),
    [refreshOrders],
  );

  const liveOrderIds = useMemo(
    () =>
      orders
        .filter(order => order.status !== 'done' && order.status !== 'rejected')
        .map(order => order.id),
    [orders],
  );

  const handleLiveOrder = useCallback((updated: Order, doc: OrderDocument) => {
    recordOrderStatusTime(doc);
    setOrders(prev =>
      prev.some(order => order.id === updated.id)
        ? prev.map(order =>
            order.id === updated.id
              ? {
                  ...updated,
                  driver: updated.driver ?? order.driver,
                  partner: updated.partner ?? order.partner,
                }
              : order,
          )
        : prev,
    );
    announceOrderStatus(doc);
  }, []);

  useOrdersRealtime(liveOrderIds, handleLiveOrder);

  const hasLiveOrders = liveOrderIds.length > 0;

  useEffect(() => {
    if (!hasLiveOrders) {
      return;
    }
    startBackgroundOrderNotifications();
    return () => {
      stopBackgroundOrderNotifications();
    };
  }, [hasLiveOrders]);

  const handleCancelRequest = useCallback(
    (order: Order) => setPendingCancel(order),
    [],
  );

  const handleCancelDismiss = useCallback(() => setPendingCancel(null), []);

  const handleCancelConfirm = useCallback(async (): Promise<void> => {
    const order = pendingCancel;
    if (!order) {
      return;
    }
    if (!partnerId) {
      setPendingCancel(null);
      setCancelError('We could not identify your partner account.');
      return;
    }
    setCancelingOrderId(order.id);
    try {
      const updated = await ordersApi.cancel({
        orderId: order.id,
        partnerId,
      });
      if (!isMounted()) {
        return;
      }
      if (updated) {
        setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      }
      setOrdersError(null);
      setPendingCancel(null);
      await refreshOrders(true);
    } catch (err) {
      if (isMounted()) {
        setPendingCancel(null);
        setCancelError(toApiError(err).userMessage);
      }
    } finally {
      if (isMounted()) {
        setCancelingOrderId(null);
      }
    }
  }, [pendingCancel, partnerId, isMounted, refreshOrders]);

  const dismissCancelError = useCallback(() => setCancelError(''), []);

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

  const handleLogout = useCallback(() => setLogoutVisible(true), []);

  const handleLogoutCancel = useCallback(() => setLogoutVisible(false), []);

  const handleLogoutConfirm = useCallback(async () => {
    setLoggingOut(true);
    try {
      await unregisterFromPush();
      if (refreshToken) {
        await authApi.logout({ refreshToken, allDevices: false });
      }
    } catch {}
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

  const openCount = orders.filter(o => o.status !== 'done').length;

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

      <View style={styles.content}>
        {activeKey === 'home' ? (
          <CreateOrderTab
            summary={ordersSummary}
            summaryIsError={ordersError !== null}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onCreated={handleOrderCreated}
            onTrackedStatusChange={handleTrackedStatusChange}
          />
        ) : (
          <OrdersTab
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            focusOrderId={focusOrderId}
            cancelingOrderId={cancelingOrderId}
            range={range}
            onRangeChange={setRange}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onCancel={handleCancelRequest}
            onTrackedStatusChange={handleTrackedStatusChange}
          />
        )}
      </View>

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

      <AppDialog
        visible={pendingCancel !== null}
        title="Cancel this order?"
        message={
          pendingCancel
            ? `The delivery will be called off. This can't be undone.`
            : ''
        }
        tone="danger"
        confirmLabel="Cancel order"
        confirmLoading={cancelingOrderId !== null}
        onConfirm={handleCancelConfirm}
        cancelLabel="Keep it"
        onCancel={handleCancelDismiss}
        testID="order-cancel-dialog"
      />

      <AppDialog
        visible={cancelError !== ''}
        title="Could not cancel order"
        message={cancelError}
        tone="danger"
        onConfirm={dismissCancelError}
        testID="order-cancel-error"
      />

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
