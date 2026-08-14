import React, { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LiveBadge } from '../LiveBadge';
import { OrderStatusTimeline } from '../OrderStatusTimeline';
import { colors } from '../../theme';
import { openWhatsApp } from '../../utils/whatsapp';
import { isTerminalStatus } from '../../hooks/useOrderTracking';
import type { OrderDocument, OrderDocumentStatus, OrderParty } from '../../api';
import type { OrderStatusTimes } from '../../services/orderStatusTimes';
import type { Order } from '../OrderCard';
import { styles } from './LiveOrderTracker.styles';

const ICON_SIZE = 16;
const AVATAR_ICON_SIZE = 18;
const PHONE_ICON_SIZE = 13;

const hasDriver = (driverId: OrderParty | string | null | undefined): boolean =>
  driverId != null && driverId !== '';

interface ContactRowProps {
  label: string;
  name?: string;
  phone?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

const ContactRow: React.FC<ContactRowProps> = ({
  label,
  name,
  phone,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const content = (
    <>
      <View style={styles.contactAvatar}>
        <Ionicons name="person" size={AVATAR_ICON_SIZE} color={colors.accent} />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        {name ? (
          <Text style={styles.contactName} numberOfLines={1}>
            {name}
          </Text>
        ) : null}
        {phone ? (
          <View style={styles.contactPhoneRow}>
            <Ionicons
              name="logo-whatsapp"
              size={PHONE_ICON_SIZE}
              color={colors.whatsapp}
            />
            <Text
              style={styles.contactPhone}
              numberOfLines={1}
              testID={testID ? `${testID}-phone` : undefined}
            >
              {phone}
            </Text>
          </View>
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
      <View style={styles.contactRow} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens WhatsApp"
      hitSlop={4}
      testID={testID}
    >
      {content}
    </Pressable>
  );
};

export interface LiveOrderTrackerProps {
  order: OrderDocument | null;
  status: OrderDocumentStatus | null;
  card: Order | null;
  isConnected: boolean;
  times?: OrderStatusTimes;
  error?: string | null;
  testID?: string;
}

const LiveOrderTrackerComponent: React.FC<LiveOrderTrackerProps> = ({
  order,
  status,
  card,
  isConnected,
  times,
  error = null,
  testID = 'live-order-tracker',
}) => {
  const isTerminal = isTerminalStatus(status);
  const driver = card?.driver;
  const driverPhone = driver?.phone;
  const customerPhone = card?.customerPhone;
  const assigned = hasDriver(order?.driverId);
  const isSearching = status === 'PENDING' && !assigned;

  const handleContactDriver = useCallback(
    () => openWhatsApp(driverPhone),
    [driverPhone],
  );

  const handleContactCustomer = useCallback(
    () => openWhatsApp(customerPhone),
    [customerPhone],
  );

  if (!order || !card) {
    return null;
  }

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          Tracking your order
        </Text>
        {isTerminal ? null : (
          <LiveBadge
            active={isConnected}
            activeLabel="Live"
            idleLabel="Reconnecting…"
            testID={`${testID}-connection`}
          />
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta} numberOfLines={1}>
          #{order._id.slice(-6)}
        </Text>
        <Text style={styles.amount}>
          {card.amount == null ? '—' : `$${card.amount.toFixed(2)}`}
        </Text>
      </View>

      {!isConnected && !isTerminal ? (
        <Text style={styles.staleNotice} testID={`${testID}-stale`}>
          Reconnecting — this may be a moment behind.
        </Text>
      ) : null}

      {error ? (
        <Text style={styles.errorNotice} testID={`${testID}-error`}>
          {error}
        </Text>
      ) : null}

      <View style={styles.divider} />

      <OrderStatusTimeline
        status={status}
        times={times}
        testID={`${testID}-timeline`}
      />

      {isSearching ? (
        <View style={styles.searching} testID={`${testID}-searching`}>
          <ActivityIndicator color={colors.primary} />
          <View style={styles.searchingText}>
            <Text style={styles.searchingTitle}>Looking for a driver</Text>
            <Text style={styles.searchingHint}>
              We're offering it to the nearest riders — this usually takes a
              moment.
            </Text>
          </View>
        </View>
      ) : null}

      {assigned ? (
        <ContactRow
          label="DRIVER"
          name={driver?.name ?? 'Assigned'}
          phone={driverPhone}
          onPress={driverPhone && !isTerminal ? handleContactDriver : undefined}
          accessibilityLabel={`Message ${
            driver?.name ?? 'the driver'
          } on ${driverPhone} on WhatsApp`}
          testID={`${testID}-driver`}
        />
      ) : null}

      <View style={styles.detail}>
        <Text style={styles.detailLabel}>DROP-OFF</Text>
        <Text style={styles.detailValue} numberOfLines={2}>
          {card.dropoff}
        </Text>
      </View>

      {customerPhone ? (
        <ContactRow
          label="CUSTOMER"
          phone={customerPhone}
          onPress={handleContactCustomer}
          accessibilityLabel={`Message customer ${customerPhone} on WhatsApp`}
          testID={`${testID}-customer`}
        />
      ) : null}

      {card.note ? (
        <Text style={styles.note} numberOfLines={3}>
          {card.note}
        </Text>
      ) : null}
    </View>
  );
};

export const LiveOrderTracker = memo(LiveOrderTrackerComponent);
LiveOrderTracker.displayName = 'LiveOrderTracker';
