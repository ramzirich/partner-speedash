import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { ORDER_STEPS } from '../../hooks/useOrderTracking';
import type { OrderDocumentStatus } from '../../api';
import type { OrderStatusTimes } from '../../services/orderStatusTimes';
import type { OrderProgress } from '../OrderCard';
import { styles } from './OrderStatusTimeline.styles';

const ICON_SIZE = 12;
const BANNER_ICON_SIZE = 22;

const STEP_LABEL: Record<OrderProgress, string> = {
  PENDING: 'Order placed',
  ASSIGNED: 'Driver assigned',
  HEADING_TO_PARTNER: 'Driver on the way to you',
  AT_PICKUP: 'Driver at your door',
  HEADING_TO_CUSTOMER: 'Out for delivery',
  DELIVERED: 'Delivered',
};

type StepState = 'done' | 'current' | 'upcoming';

const formatTime = (epochMs: number | undefined): string | null => {
  if (epochMs == null || !Number.isFinite(epochMs)) {
    return null;
  }
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
};

interface StepRowProps {
  label: string;
  state: StepState;
  frozen: boolean;
  timestamp: string | null;
  isLast: boolean;
  testID?: string;
}

const StepRow: React.FC<StepRowProps> = ({
  label,
  state,
  frozen,
  timestamp,
  isLast,
  testID,
}) => {
  const isDone = state === 'done';
  const isCurrent = state === 'current' && !frozen;

  const markerStyle = useMemo(() => {
    if (isDone) {
      return [styles.marker, styles.markerDone];
    }
    if (isCurrent) {
      return [styles.marker, styles.markerCurrent];
    }
    if (frozen) {
      return [styles.marker, styles.markerCanceled];
    }
    return [styles.marker, styles.markerUpcoming];
  }, [isDone, isCurrent, frozen]);

  const railStyle = useMemo(
    () => [styles.rail, isDone && styles.railDone],
    [isDone],
  );

  const labelStyle = useMemo(() => {
    if (frozen && !isDone) {
      return [styles.label, styles.labelCanceled];
    }
    return [styles.label, state === 'upcoming' && styles.labelUpcoming];
  }, [frozen, isDone, state]);

  return (
    <View style={styles.step} testID={testID}>
      <View style={styles.markerColumn}>
        <View style={markerStyle}>
          {isDone ? (
            <Ionicons
              name="checkmark"
              size={ICON_SIZE}
              color={colors.textOnPrimary}
            />
          ) : isCurrent ? (
            <View style={styles.markerPip} />
          ) : null}
        </View>
        {isLast ? null : <View style={railStyle} />}
      </View>

      <View style={styles.labelBlock}>
        <Text style={labelStyle}>{label}</Text>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      </View>
    </View>
  );
};

const EMPTY_TIMES: OrderStatusTimes = {};

export interface OrderStatusTimelineProps {
  status: OrderDocumentStatus | null;
  times?: OrderStatusTimes;
  testID?: string;
}

const OrderStatusTimelineComponent: React.FC<OrderStatusTimelineProps> = ({
  status,
  times = EMPTY_TIMES,
  testID = 'order-timeline',
}) => {
  const isCanceled = status === 'CANCELED';
  const isDelivered = status === 'DELIVERED';

  const currentIndex = useMemo(() => {
    if (isCanceled) {
      return ORDER_STEPS.reduce(
        (furthest, step, index) => (times[step] != null ? index : furthest),
        0,
      );
    }
    const index = ORDER_STEPS.indexOf(status as OrderProgress);
    return index < 0 ? 0 : index;
  }, [status, isCanceled, times]);

  const deliveredTime = formatTime(times.DELIVERED);
  const canceledTime = formatTime(times.CANCELED);

  return (
    <View style={styles.container} testID={testID}>
      {isDelivered ? (
        <View
          style={[styles.banner, styles.bannerDelivered]}
          accessibilityRole="alert"
          testID={`${testID}-delivered`}
        >
          <Ionicons
            name="checkmark-circle"
            size={BANNER_ICON_SIZE}
            color={colors.success}
          />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, styles.bannerTitleDelivered]}>
              Delivered
            </Text>
            <Text style={styles.bannerMessage}>
              This order is complete
              {deliveredTime ? ` — ${deliveredTime}` : ''}.
            </Text>
          </View>
        </View>
      ) : null}

      {isCanceled ? (
        <View
          style={[styles.banner, styles.bannerCanceled]}
          accessibilityRole="alert"
          testID={`${testID}-canceled`}
        >
          <Ionicons
            name="close-circle"
            size={BANNER_ICON_SIZE}
            color={colors.danger}
          />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, styles.bannerTitleCanceled]}>
              Canceled
            </Text>
            <Text style={styles.bannerMessage}>
              This order was called off
              {canceledTime ? ` at ${canceledTime}` : ''} and won't be
              delivered.
            </Text>
          </View>
        </View>
      ) : null}

      {ORDER_STEPS.map((step, index) => {
        const state: StepState =
          index < currentIndex
            ? 'done'
            : index === currentIndex
            ? 'current'
            : 'upcoming';
        const resolvedState: StepState =
          isDelivered && index <= currentIndex ? 'done' : state;

        return (
          <StepRow
            key={step}
            label={STEP_LABEL[step]}
            state={resolvedState}
            frozen={isCanceled}
            timestamp={
              resolvedState === 'upcoming' ? null : formatTime(times[step])
            }
            isLast={index === ORDER_STEPS.length - 1}
            testID={`${testID}-step-${step}`}
          />
        );
      })}
    </View>
  );
};

export const OrderStatusTimeline = memo(OrderStatusTimelineComponent);
OrderStatusTimeline.displayName = 'OrderStatusTimeline';
