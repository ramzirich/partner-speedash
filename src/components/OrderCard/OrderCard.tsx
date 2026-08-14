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

const PROGRESS_LABEL: Partial<Record<OrderProgress, string>> = {
  PENDING: 'Finding a driver',
  ASSIGNED: 'Driver assigned',
  HEADING_TO_PARTNER: 'Driver on the way to you',
  AT_PICKUP: 'Driver at your door',
  HEADING_TO_CUSTOMER: 'Out for delivery',
  DELIVERED: 'Delivered',
};

const ICON_SIZE = 16;

const formatMoney = (amount: number | undefined, currency: string): string =>
  amount == null ? '—' : `${currency === 'USD' ? '$' : ''}${amount.toFixed(2)}`;

interface InfoRowProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  meta?: string;
  accent?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  iconColor,
  label,
  value,
  meta,
  accent = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const content = (
    <>
      <View style={styles.badge}>
        <Ionicons name={icon} size={ICON_SIZE} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={ICON_SIZE}
          color={colors.textSecondary}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, accent && styles.rowAccent]}>{content}</View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        accent && styles.rowAccent,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={4}
      testID={testID}
    >
      {content}
    </Pressable>
  );
};

export interface OrderCardProps {
  order: Order;
  onCancel?: (order: Order) => void;
  onShowDetails?: (order: Order) => void;
  canceling?: boolean;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({
  order,
  onCancel,
  onShowDetails,
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
      Linking.openURL(dropoffLink).catch(() => {});
    }
  }, [dropoffLink]);

  const handleCancel = useCallback(() => onCancel?.(order), [onCancel, order]);

  const handleShowDetails = useCallback(
    () => onShowDetails?.(order),
    [onShowDetails, order],
  );

  const headerStyle = useMemo(
    () => [styles.header, { backgroundColor: `${status.color}14` }],
    [status.color],
  );
  const dotStyle = useMemo(
    () => [styles.dot, { backgroundColor: status.color }],
    [status.color],
  );
  const statusTextStyle = useMemo(
    () => [styles.statusText, { color: status.color }],
    [status.color],
  );

  return (
    <View style={styles.card}>
      <View style={headerStyle}>
        <View style={styles.status}>
          <View style={dotStyle} />
          <Text style={statusTextStyle} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
        <Text
          style={styles.orderId}
          numberOfLines={1}
          testID={`order-${order.id}-id`}
        >
          #{order.id.slice(-6)}
        </Text>
      </View>

      <View style={styles.body}>
        <InfoRow
          icon="location"
          iconColor={colors.primary}
          label="DROP-OFF"
          value={order.dropoff}
          accent
          onPress={dropoffLink ? handleOpenMap : undefined}
          accessibilityLabel={`Open the drop-off at ${order.dropoff} in Maps`}
          accessibilityHint="Opens Google Maps"
          testID={`order-${order.id}-dropoff-map`}
        />

        {driver ? (
          <InfoRow
            icon={driverPhone ? 'logo-whatsapp' : 'bicycle'}
            iconColor={driverPhone ? colors.whatsapp : colors.textSecondary}
            label="DRIVER"
            value={driver.name}
            meta={driverPhone}
            onPress={driverPhone ? handleCallDriver : undefined}
            accessibilityLabel={`Message ${driver.name} on ${driverPhone} on WhatsApp`}
            accessibilityHint="Opens WhatsApp"
            testID={`order-${order.id}-whatsapp-driver`}
          />
        ) : null}

        {customerPhone ? (
          <InfoRow
            icon="logo-whatsapp"
            iconColor={colors.whatsapp}
            label="CUSTOMER"
            value={customerPhone}
            onPress={handleCall}
            accessibilityLabel={`Message customer ${customerPhone} on WhatsApp`}
            accessibilityHint="Opens WhatsApp"
            testID={`order-${order.id}-whatsapp`}
          />
        ) : null}

        {note ? (
          <View style={styles.note}>
            <Text style={styles.noteText} numberOfLines={2}>
              {note}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.label}>DELIVERY FEE</Text>
          <Text style={styles.amount} testID={`order-${order.id}-fee`}>
            {formatMoney(order.amount, order.currency)}
          </Text>
        </View>

        {onShowDetails || (cancellable && onCancel) ? (
          <View style={styles.actions}>
            {onShowDetails ? (
              <AppButton
                label="Show details"
                variant="secondary"
                fullWidth
                onPress={handleShowDetails}
                testID={`order-${order.id}-details`}
              />
            ) : null}

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
        ) : null}
      </View>
    </View>
  );
};

export const OrderCard = memo(OrderCardComponent);
OrderCard.displayName = 'OrderCard';
