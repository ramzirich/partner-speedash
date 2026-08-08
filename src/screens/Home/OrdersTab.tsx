import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Text,
  View,
} from 'react-native';
import { CalendarDatePicker } from '../../components/CalendarDatePicker';
import type { DateRange } from '../../components/CalendarDatePicker';
import {
  Order,
  OrderCard,
  OrderProgress,
  OrderStatus,
} from '../../components/OrderCard';
import { colors } from '../../theme';
import { styles } from './OrdersTab.styles';

export interface OrdersTabProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  /**
   * Order the driver came here to see (tapped its notification) — scrolled into
   * view once it exists in the list.
   */
  focusOrderId?: string | null;
  /** Order whose status change is in flight — its card shows a busy button. */
  updatingOrderId?: string | null;
  /** Days the list covers. Owned by the screen — it drives the fetch. */
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onAccept: (order: Order) => void;
  onDecline: (order: Order) => void;
  onAdvanceStatus: (order: Order, next: OrderProgress) => void;
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

const sortByStatus = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

/**
 * Orders tab: a date picker on top, then the selected day's orders as cards
 * (pending pinned to the top). Orders + accept/decline are owned by the parent.
 */
const OrdersTabComponent: React.FC<OrdersTabProps> = ({
  orders,
  loading = false,
  error = null,
  focusOrderId = null,
  updatingOrderId = null,
  range,
  onRangeChange,
  onAccept,
  onDecline,
  onAdvanceStatus,
}) => {
  const listRef = useRef<FlatList<Order>>(null);
  /** Order already scrolled to, so a later refetch doesn't yank the list back. */
  const scrolledForRef = useRef<string | null>(null);

  const data = useMemo(() => sortByStatus(orders), [orders]);

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
        onAccept={onAccept}
        onDecline={onDecline}
        onAdvanceStatus={onAdvanceStatus}
        updating={item.id === updatingOrderId}
      />
    ),
    [onAccept, onDecline, onAdvanceStatus, updatingOrderId],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  return (
    <View style={styles.container}>
      <CalendarDatePicker value={range} onChange={onRangeChange} />

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
              <Text style={styles.placeholderText}>
                {error ?? 'No orders for this day.'}
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
};

export const OrdersTab = memo(OrdersTabComponent);
OrdersTab.displayName = 'OrdersTab';
