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
  Text,
  View,
} from 'react-native';
import { CalendarDatePicker } from '../../components/CalendarDatePicker';
import type { DateRange } from '../../components/CalendarDatePicker';
import { Order, OrderCard, OrderStatus } from '../../components/OrderCard';
import { colors } from '../../theme';
import { styles } from './OrdersTab.styles';

export interface OrdersTabProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  /**
   * Order the partner came here to see (tapped its notification) — scrolled
   * into view once it exists in the list.
   */
  focusOrderId?: string | null;
  /** Order whose cancel is in flight — its card shows a busy button. */
  cancelingOrderId?: string | null;
  /** Days the list covers. Owned by the screen — it drives the fetch. */
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onCancel: (order: Order) => void;
}

/** Display order: pending first, then on-delivery, then the rest. */
const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  on_delivery: 1,
  done: 2,
  rejected: 3,
};

/** Let the list mount/settle before scrolling to the notified order. */
const SCROLL_DELAY_MS = 250;
/** Park the focused card just below the top edge, not flush against it. */
const SCROLL_VIEW_POSITION = 0.1;

/**
 * The two lists the tab switches between. "Open" is everything still in play —
 * waiting on a driver, under way, or called off; delivered is the only status
 * that leaves it, which is the same split the bottom bar's badge counts.
 */
type OrdersSegment = 'open' | 'delivered';

const isDelivered = (order: Order): boolean => order.status === 'done';

const sortByStatus = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

/** Finished orders read best newest-first — an undated one sinks to the bottom. */
const sortByNewest = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

interface SegmentButtonProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  testID?: string;
}

/** One half of the open/delivered switch: a label with its tally beside it. */
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

/**
 * Orders tab: a date picker on top, an open/delivered switch under it, then the
 * selected segment's cards (pending pinned to the top of the open list).
 * Orders + cancelling are owned by the parent.
 */
const OrdersTabComponent: React.FC<OrdersTabProps> = ({
  orders,
  loading = false,
  error = null,
  focusOrderId = null,
  cancelingOrderId = null,
  range,
  onRangeChange,
  onCancel,
}) => {
  const listRef = useRef<FlatList<Order>>(null);
  /** Order already scrolled to, so a later refetch doesn't yank the list back. */
  const scrolledForRef = useRef<string | null>(null);
  const [segment, setSegment] = useState<OrdersSegment>('open');

  const openOrders = useMemo(
    () => sortByStatus(orders.filter(order => !isDelivered(order))),
    [orders],
  );
  const deliveredOrders = useMemo(
    () => sortByNewest(orders.filter(isDelivered)),
    [orders],
  );

  const data = segment === 'open' ? openOrders : deliveredOrders;

  // A notification opens the order it was about — which may well be the
  // delivery that just landed, i.e. the other list. Follow it there.
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
    // One frame's grace: the FlatList has just mounted with this tab.
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

  const renderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => (
      <OrderCard
        order={item}
        onCancel={onCancel}
        canceling={item.id === cancelingOrderId}
      />
    ),
    [onCancel, cancelingOrderId],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  const showOpen = useCallback(() => setSegment('open'), []);
  const showDelivered = useCallback(() => setSegment('delivered'), []);

  const emptyText =
    segment === 'open'
      ? 'No open orders for these days.'
      : 'No delivered orders for these days.';

  return (
    <View style={styles.container}>
      <CalendarDatePicker value={range} onChange={onRangeChange} />

      {/* Open ⇄ delivered. The count sits on the open side — it's the one
          that needs watching, and it matches the bottom bar's badge. */}
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
    </View>
  );
};

export const OrdersTab = memo(OrdersTabComponent);
OrdersTab.displayName = 'OrdersTab';
