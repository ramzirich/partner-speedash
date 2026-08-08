import React, { memo, useCallback, useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppDropdown } from '../AppDropdown';
import type { AppDropdownOption } from '../AppDropdown';
import { colors } from '../../theme';
import { styles } from './OrderCard.styles';

export type OrderStatus = 'pending' | 'on_delivery' | 'done' | 'rejected';

export type OrderProgress =
  | 'PENDING'
  | 'ASSIGNED'
  | 'HEADING_TO_PARTNER'
  | 'AT_PICKUP'
  | 'HEADING_TO_CUSTOMER'
  | 'DELIVERED';

export interface OrderCoordinates {
  latitude: number;
  longitude: number;
}

export interface OrderPartner {
  id?: string;
  name: string;
  phone?: string;
}

export interface Order {
  id: string;
  pickup: string;
  dropoff: string;
  amount?: number;
  currency: string;
  status: OrderStatus;
  partner?: OrderPartner;
  pickupCoordinates?: OrderCoordinates;

  customerPhone?: string;
  /** Short line under the addresses — e.g. the offer message from the server. */
  note?: string;
  progress?: OrderProgress;
}

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.warning },
  on_delivery: { label: 'On delivery', color: colors.accent },
  done: { label: 'Done', color: colors.success },
  rejected: { label: 'Rejected', color: colors.danger },
};

const PROGRESS_LABEL: Partial<Record<OrderProgress, string>> = {
  ASSIGNED: 'Assigned',
  HEADING_TO_PARTNER: 'To partner',
  AT_PICKUP: 'At pickup',
  HEADING_TO_CUSTOMER: 'To customer',
};

const STEP_NAME: Record<OrderProgress, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  HEADING_TO_PARTNER: 'Heading to partner',
  AT_PICKUP: 'At pickup',
  HEADING_TO_CUSTOMER: 'Heading to customer',
  DELIVERED: 'Delivered',
};

/** The step's human name — the screen words its busy overlay from this. */
export const orderStepName = (progress: OrderProgress): string =>
  STEP_NAME[progress];

const STEP_FLOW: readonly OrderProgress[] = [
  'ASSIGNED',
  'HEADING_TO_PARTNER',
  'AT_PICKUP',
  'HEADING_TO_CUSTOMER',
  'DELIVERED',
];

const stepOptions = (
  progress: OrderProgress | undefined,
): AppDropdownOption[] => {
  if (!progress || progress === 'DELIVERED') {
    return [];
  }
  const index = STEP_FLOW.indexOf(progress);
  if (index < 0) {
    return [];
  }
  const options: AppDropdownOption[] = [];
  const previous = STEP_FLOW[index - 1];
  if (previous) {
    options.push({
      value: previous,
      label: `Back — ${STEP_NAME[previous]}`,
    });
  }
  // The step the order sits on right now, between the two it can move to, so
  // the menu reads as a timeline. Shown for orientation only — never choosable,
  // since re-sending the current status is a no-op the server would reject.
  options.push({
    value: progress,
    label: `Now — ${STEP_NAME[progress]}`,
    disabled: true,
  });
  const next = STEP_FLOW[index + 1];
  if (next) {
    options.push({
      value: next,
      label: `Next — ${STEP_NAME[next]}`,
      tone: 'success',
    });
  }
  return options;
};

const RESPONSE_ACCEPTED = 'accepted';
const RESPONSE_REJECTED = 'rejected';

const RESPONSE_OPTIONS: readonly AppDropdownOption[] = [
  { value: RESPONSE_ACCEPTED, label: 'Accept order', tone: 'success' },
  { value: RESPONSE_REJECTED, label: 'Reject order', tone: 'danger' },
];

const ICON_SIZE = 14;

const formatMoney = (amount: number | undefined, currency: string): string =>
  amount == null ? '—' : `${currency === 'USD' ? '$' : ''}${amount.toFixed(2)}`;

const directionsUrl = ({ latitude, longitude }: OrderCoordinates): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

export interface OrderCardProps {
  order: Order;
  onAccept?: (order: Order) => void;
  onDecline?: (order: Order) => void;
  onAdvanceStatus?: (order: Order, next: OrderProgress) => void;
  updating?: boolean;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({
  order,
  onAccept,
  onDecline,
  onAdvanceStatus,
  updating = false,
}) => {
  const status = STATUS_META[order.status];
  const { customerPhone, note, partner, pickupCoordinates, progress } = order;
  const partnerPhone = partner?.phone;
  const statusLabel =
    (progress ? PROGRESS_LABEL[progress] : undefined) ?? status.label;

  const handleCall = useCallback(async () => {
    const number = customerPhone?.replace(/\D/g, '');
    if (!number) {
      return;
    }
    const appUrl = `whatsapp://send?phone=${number}`;
    const webUrl = `https://wa.me/${number}`;
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
    } catch {
      // No WhatsApp and no browser — there is nothing left to fall back to.
    }
  }, [customerPhone]);

  const handleCallPartner = useCallback(() => {
    if (partnerPhone) {
      Linking.openURL(`tel:${partnerPhone}`).catch(() => {
        // Same as above — no dialer, nothing to recover from.
      });
    }
  }, [partnerPhone]);

  const handleNavigate = useCallback(() => {
    if (pickupCoordinates) {
      Linking.openURL(directionsUrl(pickupCoordinates)).catch(() => {
        // No Maps app and no browser — there is nothing else to fall back to.
      });
    }
  }, [pickupCoordinates]);

  const handleRespond = useCallback(
    (value: string) => {
      if (value === RESPONSE_ACCEPTED) {
        onAccept?.(order);
      } else {
        onDecline?.(order);
      }
    },
    [order, onAccept, onDecline],
  );

  const statusOptions = useMemo(() => stepOptions(progress), [progress]);

  const handleStatusSelect = useCallback(
    (value: string) => {
      // Narrow through the flow rather than casting — the dropdown hands back a
      // plain string, and only a real step should ever reach the API.
      const next = STEP_FLOW.find(step => step === value);
      if (next) {
        onAdvanceStatus?.(order, next);
      }
    },
    [order, onAdvanceStatus],
  );

  const cardStyle = useMemo(
    () => [styles.card, { borderLeftColor: status.color }],
    [status.color],
  );
  const tagStyle = useMemo(
    () => [styles.tag, { backgroundColor: `${status.color}1A` }],
    [status.color],
  );
  const dotStyle = useMemo(
    () => [styles.dot, { backgroundColor: status.color }],
    [status.color],
  );
  const tagTextStyle = useMemo(
    () => [styles.tagText, { color: status.color }],
    [status.color],
  );

  return (
    <View style={cardStyle}>
      {/* Top: partner ↔ status */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.label}>PARTNER</Text>
          <Text style={styles.partnerName} numberOfLines={1}>
            {partner?.name ?? '—'}
          </Text>
        </View>
        <View style={tagStyle}>
          <View style={dotStyle} />
          <Text style={tagTextStyle}>{statusLabel}</Text>
        </View>
      </View>

      {/* Partner number — tap to call the business about the pickup. */}
      {partnerPhone ? (
        <Pressable
          style={({ pressed }) => [
            styles.contactRow,
            pressed && styles.pressed,
          ]}
          onPress={handleCallPartner}
          accessibilityRole="button"
          accessibilityLabel={`Call ${partner?.name ?? 'partner'} at ${partnerPhone}`}
          hitSlop={8}
          testID={`order-${order.id}-call-partner`}>
          <Ionicons
            name="storefront-outline"
            size={ICON_SIZE}
            color={colors.textSecondary}
          />
          <Text style={styles.contactPhone} numberOfLines={1}>
            {partnerPhone}
          </Text>
        </Pressable>
      ) : null}

      {/* Route. The pickup is a button while the driver still has to drive to
          it; otherwise it's the same read-only line as the drop-off. */}
      {pickupCoordinates ? (
        <Pressable
          style={({ pressed }) => [
            styles.navigateButton,
            pressed && styles.pressed,
          ]}
          onPress={handleNavigate}
          accessibilityRole="button"
          accessibilityLabel={`Open directions to the pickup at ${order.pickup}`}
          accessibilityHint="Opens Google Maps"
          hitSlop={4}
          testID={`order-${order.id}-navigate`}>
          <Ionicons
            name="navigate"
            size={ICON_SIZE}
            color={colors.textOnPrimary}
          />
          <View style={styles.navigateText}>
            <Text style={styles.navigateLabel}>PICKUP</Text>
            <Text style={styles.navigateValue} numberOfLines={1}>
              {order.pickup}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={ICON_SIZE}
            color={colors.textOnPrimary}
          />
        </Pressable>
      ) : (
        <View style={styles.place}>
          <Text style={styles.label}>PICKUP</Text>
          <Text style={styles.location} numberOfLines={1}>
            {order.pickup}
          </Text>
        </View>
      )}

      <View style={styles.place}>
        <Text style={styles.label}>DROP-OFF</Text>
        <Text style={styles.location} numberOfLines={1}>
          {order.dropoff}
        </Text>
      </View>

      {/* Server-supplied line (offer message / partner note). */}
      {note ? (
        <Text style={styles.note} numberOfLines={2}>
          {note}
        </Text>
      ) : null}

      {/* Customer number — active orders only (ASSIGNED / AT_PICKUP / ON_WAY).
          Opens WhatsApp rather than the dialer. */}
      {customerPhone ? (
        <Pressable
          style={({ pressed }) => [
            styles.customerRow,
            pressed && styles.pressed,
          ]}
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel={`Message customer ${customerPhone} on WhatsApp`}
          accessibilityHint="Opens WhatsApp"
          hitSlop={8}
          testID={`order-${order.id}-whatsapp`}>
          <Text style={styles.customerLabel}>CUSTOMER</Text>
          <View style={styles.customerAction}>
            <Ionicons
              name="logo-whatsapp"
              size={ICON_SIZE}
              color={colors.whatsapp}
            />
            <Text style={styles.customerPhone} numberOfLines={1}>
              {customerPhone}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* Bottom: order id ↔ delivery fee */}
      <View style={styles.footerRow}>
        <View style={styles.footerText}>
          <Text style={styles.label}>ORDER</Text>
          <Text
            style={styles.orderId}
            numberOfLines={1}
            ellipsizeMode="middle"
            testID={`order-${order.id}-id`}>
            #{order.id}
          </Text>
        </View>
        <View style={styles.footerFee}>
          <Text style={styles.label}>DELIVERY FEE</Text>
          <Text style={styles.amount}>
            {formatMoney(order.amount, order.currency)}
          </Text>
        </View>
      </View>

      {/* Respond — pending orders only. */}
      {order.status === 'pending' ? (
        <AppDropdown
          options={RESPONSE_OPTIONS}
          placeholder="Respond to this order"
          onSelect={handleRespond}
          accessibilityLabel={`Respond to order ${order.id}`}
          testID={`order-${order.id}-response`}
        />
      ) : null}

      {/* Move a step. The current status sits in the middle, flanked by the only
          neighbours on offer — forward to progress, back to undo — and nothing
          at all once the order is delivered. Selecting it surfaces the current
          step on the closed trigger too; while a PATCH is in flight we drop back
          to the placeholder so it reads "Updating status…". */}
      {statusOptions.length > 0 && onAdvanceStatus ? (
        <AppDropdown
          options={statusOptions}
          value={updating ? null : progress}
          placeholder={updating ? 'Updating status…' : 'Update delivery status'}
          onSelect={handleStatusSelect}
          disabled={updating}
          accessibilityLabel={`Update the status of order ${order.id}. Currently ${
            progress ? STEP_NAME[progress] : status.label
          }.`}
          testID={`order-${order.id}-status`}
        />
      ) : null}
    </View>
  );
};

export const OrderCard = memo(OrderCardComponent);
OrderCard.displayName = 'OrderCard';
