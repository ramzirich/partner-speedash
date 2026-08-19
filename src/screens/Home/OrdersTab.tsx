import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { CalendarDatePicker } from '../../components/CalendarDatePicker';
import type { DateRange } from '../../components/CalendarDatePicker';
import { Order, OrderCard, OrderStatus } from '../../components/OrderCard';
import { OrderDetailsSheet } from '../../components/OrderDetailsSheet';
import type { OrderDocument, OrderDocumentStatus } from '../../api';
import { colors } from '../../theme';
import { styles } from './OrdersTab.styles';

export interface OrdersTabProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  focusOrderId?: string | null;
  cancelingOrderId?: string | null;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onCancel: (order: Order) => void;
  onTrackedStatusChange?: (
    status: OrderDocumentStatus,
    order: OrderDocument,
  ) => void;
}

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  on_delivery: 1,
  done: 2,
  rejected: 3,
};

const SCROLL_DELAY_MS = 250;
const SCROLL_VIEW_POSITION = 0.1;

type OrdersSegment = 'open' | 'delivered';

const isDelivered = (order: Order): boolean => order.status === 'done';

const sortByStatus = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

const sortByNewest = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

interface SegmentButtonProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  testID?: string;
}

const SegmentButton: React.FC<SegmentButtonProps> = ({
  label,
  count,
  active,
  onPress,
  testID,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.segment,
      active && styles.segmentActive,
      pressed && styles.segmentPressed,
    ]}
    onPress={onPress}
    accessibilityRole="tab"
    accessibilityLabel={`${label}, ${count} ${
      count === 1 ? 'order' : 'orders'
    }`}
    accessibilityState={{ selected: active }}
    testID={testID}
  >
    <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
      {label}
    </Text>
    <View style={[styles.segmentCount, active && styles.segmentCountActive]}>
      <Text
        style={[
          styles.segmentCountText,
          active && styles.segmentCountTextActive,
        ]}
      >
        {count}
      </Text>
    </View>
  </Pressable>
);

const OrdersTabComponent: React.FC<OrdersTabProps> = ({
  orders,
  loading = false,
  error = null,
  focusOrderId = null,
  cancelingOrderId = null,
  range,
  onRangeChange,
  refreshing = false,
  onRefresh,
  onCancel,
  onTrackedStatusChange,
}) => {
  const listRef = useRef<FlatList<Order>>(null);
  const scrolledForRef = useRef<string | null>(null);
  const [segment, setSegment] = useState<OrdersSegment>('open');
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);

  const openOrders = useMemo(
    () => sortByStatus(orders.filter(order => !isDelivered(order))),
    [orders],
  );
  const deliveredOrders = useMemo(
    () => sortByNewest(orders.filter(isDelivered)),
    [orders],
  );

  const data = segment === 'open' ? openOrders : deliveredOrders;

  useEffect(() => {
    if (!focusOrderId) {
      return;
    }
    const target = orders.find(order => order.id === focusOrderId);
    if (target) {
      setSegment(isDelivered(target) ? 'delivered' : 'open');
    }
  }, [focusOrderId, orders]);

  useEffect(() => {
    if (!focusOrderId || scrolledForRef.current === focusOrderId) {
      return;
    }
    const index = data.findIndex(order => order.id === focusOrderId);
    if (index < 0) {
      return;
    }
    scrolledForRef.current = focusOrderId;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: SCROLL_VIEW_POSITION,
      });
    }, SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focusOrderId, data]);

  const handleScrollToIndexFailed = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleShowDetails = useCallback(
    (order: Order) => setDetailsOrderId(order.id),
    [],
  );

  const handleCloseDetails = useCallback(() => setDetailsOrderId(null), []);

  const renderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => (
      <OrderCard
        order={item}
        onCancel={onCancel}
        onShowDetails={isDelivered(item) ? undefined : handleShowDetails}
        canceling={item.id === cancelingOrderId}
      />
    ),
    [onCancel, handleShowDetails, cancelingOrderId],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      ) : undefined,
    [refreshing, onRefresh],
  );

  const showOpen = useCallback(() => setSegment('open'), []);
  const showDelivered = useCallback(() => setSegment('delivered'), []);

  const emptyText =
    segment === 'open'
      ? 'No open orders for these days.'
      : 'No delivered orders for these days.';

  return (
    <View style={styles.container}>
      <CalendarDatePicker value={range} onChange={onRangeChange} />

      <View style={styles.segments} accessibilityRole="tablist">
        <SegmentButton
          label="Open"
          count={openOrders.length}
          active={segment === 'open'}
          onPress={showOpen}
          testID="orders-segment-open"
        />
        <SegmentButton
          label="Delivered"
          count={deliveredOrders.length}
          active={segment === 'delivered'}
          onPress={showDelivered}
          testID="orders-segment-delivered"
        />
      </View>

      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        refreshControl={refreshControl}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.placeholder}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.placeholderText}>{error ?? emptyText}</Text>
            )}
          </View>
        }
      />

      <OrderDetailsSheet
        orderId={detailsOrderId}
        onClose={handleCloseDetails}
        onStatusChange={onTrackedStatusChange}
      />
    </View>
  );
};

export const OrdersTab = memo(OrdersTabComponent);
OrdersTab.displayName = 'OrdersTab';
