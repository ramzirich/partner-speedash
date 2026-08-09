import React, { memo, useCallback, useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton } from '../AppButton';
import { colors } from '../../theme';
import { openWhatsApp } from '../../utils/whatsapp';
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
  dropoffLink?: string;
  amount?: number;
  currency: string;
  status: OrderStatus;
  partner?: OrderPartner;
  driver?: OrderPartner;
  pickupCoordinates?: OrderCoordinates;

  customerPhone?: string;
  /** Short line under the addresses — e.g. the offer message from the server. */
  note?: string;
  progress?: OrderProgress;
  createdAt?: number;
  cancellable?: boolean;
}

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.warning },
  on_delivery: { label: 'On delivery', color: colors.accent },
  done: { label: 'Done', color: colors.success },
  rejected: { label: 'Canceled', color: colors.danger },
};

/** The live step, spelled out — more use to a partner than "on delivery". */
const PROGRESS_LABEL: Partial<Record<OrderProgress, string>> = {
  PENDING: 'Finding a driver',
  ASSIGNED: 'Driver assigned',
  HEADING_TO_PARTNER: 'Driver on the way to you',
  AT_PICKUP: 'Driver at your door',
  HEADING_TO_CUSTOMER: 'Out for delivery',
  DELIVERED: 'Delivered',
};

const ICON_SIZE = 14;

const formatMoney = (amount: number | undefined, currency: string): string =>
  amount == null ? '—' : `${currency === 'USD' ? '$' : ''}${amount.toFixed(2)}`;

export interface OrderCardProps {
  order: Order;
  onCancel?: (order: Order) => void;
  canceling?: boolean;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({
  order,
  onCancel,
  canceling = false,
}) => {
  const status = STATUS_META[order.status];
  const { cancellable, customerPhone, driver, dropoffLink, note, progress } =
    order;
  const driverPhone = driver?.phone;
  const statusLabel =
    (progress ? PROGRESS_LABEL[progress] : undefined) ?? status.label;

  const handleCall = useCallback(
    () => openWhatsApp(customerPhone),
    [customerPhone],
  );

  const handleCallDriver = useCallback(
    () => openWhatsApp(driverPhone),
    [driverPhone],
  );

  const handleOpenMap = useCallback(() => {
    if (dropoffLink) {
      Linking.openURL(dropoffLink).catch(() => {
        // No Maps app and no browser — nothing to fall back to.
      });
    }
  }, [dropoffLink]);

  const handleCancel = useCallback(() => onCancel?.(order), [onCancel, order]);

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
      {/* Top: where it stands ↔ what it costs, with the id underneath. */}
      <View style={styles.headerRow}>
        <View style={tagStyle}>
          <View style={dotStyle} />
          <Text style={tagTextStyle}>{statusLabel}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.amount} testID={`order-${order.id}-fee`}>
            {formatMoney(order.amount, order.currency)}
          </Text>
          <Text
            style={styles.orderId}
            numberOfLines={1}
            testID={`order-${order.id}-id`}
          >
            #{order.id.slice(-6)}
          </Text>
        </View>
      </View>

      {/* Drop-off. A button when the order carries a maps link, otherwise the
          same line without the affordance. */}
      {dropoffLink ? (
        <Pressable
          style={({ pressed }) => [
            styles.navigateButton,
            pressed && styles.pressed,
          ]}
          onPress={handleOpenMap}
          accessibilityRole="button"
          accessibilityLabel={`Open the drop-off at ${order.dropoff} in Maps`}
          accessibilityHint="Opens Google Maps"
          hitSlop={4}
          testID={`order-${order.id}-dropoff-map`}
        >
          <Ionicons name="location" size={ICON_SIZE} color={colors.primary} />
          <View style={styles.navigateText}>
            <Text style={styles.label}>DROP-OFF</Text>
            <Text style={styles.navigateValue} numberOfLines={1}>
              {order.dropoff}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={ICON_SIZE}
            color={colors.primary}
          />
        </Pressable>
      ) : (
        <View style={styles.place}>
          <Text style={styles.label}>DROP-OFF</Text>
          <Text style={styles.location} numberOfLines={2}>
            {order.dropoff}
          </Text>
        </View>
      )}

      {/* Who's carrying it. Tappable to call once the payload carries a number;
          otherwise it's the driver's name on its own. */}
      {driver ? (
        driverPhone ? (
          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              pressed && styles.pressed,
            ]}
            onPress={handleCallDriver}
            accessibilityRole="button"
            accessibilityLabel={`Message ${driver.name} on ${driverPhone} on WhatsApp`}
            accessibilityHint="Opens WhatsApp"
            hitSlop={8}
            testID={`order-${order.id}-whatsapp-driver`}
          >
            <Text style={styles.contactLabel}>DRIVER</Text>
            <View style={styles.contactAction}>
              <Text style={styles.contactName} numberOfLines={1}>
                {driver.name}
              </Text>
              <Ionicons
                name="logo-whatsapp"
                size={ICON_SIZE}
                color={colors.whatsapp}
              />
              <Text style={styles.contactValue} numberOfLines={1}>
                {driverPhone}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>DRIVER</Text>
            <Text style={styles.contactValue} numberOfLines={1}>
              {driver.name}
            </Text>
          </View>
        )
      ) : null}

      {/* Customer number — opens WhatsApp rather than the dialer. */}
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
          testID={`order-${order.id}-whatsapp`}
        >
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

      {note ? (
        <Text style={styles.note} numberOfLines={2}>
          {note}
        </Text>
      ) : null}

      {/* Only while the parcel is still in nobody's hands. */}
      {cancellable && onCancel ? (
        <AppButton
          label="Cancel order"
          variant="outline"
          fullWidth
          loading={canceling}
          onPress={handleCancel}
          testID={`order-${order.id}-cancel`}
        />
      ) : null}
    </View>
  );
};

export const OrderCard = memo(OrderCardComponent);
OrderCard.displayName = 'OrderCard';
