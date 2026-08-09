import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { ORDER_STEPS } from '../../hooks/useOrderTracking';
import type { OrderDocumentStatus } from '../../api';
import type { OrderProgress } from '../OrderCard';
import { styles } from './OrderStatusTimeline.styles';

const ICON_SIZE = 12;
const BANNER_ICON_SIZE = 22;

const STEP_COPY: Record<OrderProgress, { label: string; hint: string }> = {
  PENDING: {
    label: 'Order placed',
    hint: 'Looking for a driver nearby',
  },
  ASSIGNED: {
    label: 'Driver assigned',
    hint: 'A driver has taken the job',
  },
  HEADING_TO_PARTNER: {
    label: 'Driver on the way to you',
    hint: 'Have the parcel ready',
  },
  AT_PICKUP: {
    label: 'Driver at your door',
    hint: 'Hand the parcel over',
  },
  HEADING_TO_CUSTOMER: {
    label: 'Out for delivery',
    hint: 'On the way to the customer',
  },
  DELIVERED: {
    label: 'Delivered',
    hint: 'The customer has the parcel',
  },
};

type StepState = 'done' | 'current' | 'upcoming';

const formatTime = (unixSeconds: number | undefined): string | null => {
  if (unixSeconds == null || !Number.isFinite(unixSeconds)) {
    return null;
  }
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
};

interface StepRowProps {
  label: string;
  hint: string;
  state: StepState;
  frozen: boolean;
  timestamp: string | null;
  isLast: boolean;
  testID?: string;
}

const StepRow: React.FC<StepRowProps> = ({
  label,
  hint,
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

  const hintStyle = useMemo(
    () => [styles.hint, isCurrent && styles.hintCurrent],
    [isCurrent],
  );

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
        {isCurrent ? <Text style={hintStyle}>{hint}</Text> : null}
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      </View>
    </View>
  );
};

export interface OrderStatusTimelineProps {
  status: OrderDocumentStatus | null;
  assignedAt?: number;
  deliveredAt?: number;
  testID?: string;
}

const OrderStatusTimelineComponent: React.FC<OrderStatusTimelineProps> = ({
  status,
  assignedAt,
  deliveredAt,
  testID = 'order-timeline',
}) => {
  const isCanceled = status === 'CANCELED';
  const isDelivered = status === 'DELIVERED';

  const currentIndex = useMemo(() => {
    if (isCanceled) {
      return assignedAt != null ? ORDER_STEPS.indexOf('ASSIGNED') : 0;
    }
    const index = ORDER_STEPS.indexOf(status as OrderProgress);
    return index < 0 ? 0 : index;
  }, [status, isCanceled, assignedAt]);

  const assignedTime = formatTime(assignedAt);
  const deliveredTime = formatTime(deliveredAt);

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
              This order was called off and won't be delivered.
            </Text>
          </View>
        </View>
      ) : null}

      {ORDER_STEPS.map((step, index) => {
        const copy = STEP_COPY[step];
        const state: StepState =
          index < currentIndex
            ? 'done'
            : index === currentIndex
            ? 'current'
            : 'upcoming';
        const resolvedState: StepState =
          isDelivered && index <= currentIndex ? 'done' : state;
        const timestamp =
          step === 'ASSIGNED'
            ? assignedTime
            : step === 'DELIVERED'
            ? deliveredTime
            : null;

        return (
          <StepRow
            key={step}
            label={copy.label}
            hint={copy.hint}
            state={resolvedState}
            frozen={isCanceled}
            timestamp={resolvedState === 'upcoming' ? null : timestamp}
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
