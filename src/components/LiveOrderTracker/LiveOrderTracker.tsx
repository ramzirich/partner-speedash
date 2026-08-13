import React, { memo, useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LiveBadge } from '../LiveBadge';
import { OrderStatusTimeline } from '../OrderStatusTimeline';
import { colors } from '../../theme';
import { openWhatsApp } from '../../utils/whatsapp';
import { isTerminalStatus } from '../../hooks/useOrderTracking';
import type { OrderDocument, OrderDocumentStatus, OrderParty } from '../../api';
import type { Order } from '../OrderCard';
import { styles } from './LiveOrderTracker.styles';

const ICON_SIZE = 16;
const AVATAR_ICON_SIZE = 18;
const PHONE_ICON_SIZE = 13;

const toSeconds = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed / 1000 : undefined;
  }
  return undefined;
};

const hasDriver = (driverId: OrderParty | string | null | undefined): boolean =>
  driverId != null && driverId !== '';

export interface LiveOrderTrackerProps {
  order: OrderDocument | null;
  status: OrderDocumentStatus | null;
  card: Order | null;
  isConnected: boolean;
  error?: string | null;
  testID?: string;
}

const LiveOrderTrackerComponent: React.FC<LiveOrderTrackerProps> = ({
  order,
  status,
  card,
  isConnected,
  error = null,
  testID = 'live-order-tracker',
}) => {
  const isTerminal = isTerminalStatus(status);
  const driver = card?.driver;
  const driverPhone = driver?.phone;
  const assigned = hasDriver(order?.driverId);
  const isSearching = status === 'PENDING' && !assigned;

  const handleContactDriver = useCallback(
    () => openWhatsApp(driverPhone),
    [driverPhone],
  );

  const assignedAt = useMemo(
    () => toSeconds(order?.assignedAt),
    [order?.assignedAt],
  );
  const deliveredAt = useMemo(
    () => toSeconds(order?.deliveredAt),
    [order?.deliveredAt],
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
        assignedAt={assignedAt}
        deliveredAt={deliveredAt}
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
        <View style={styles.driverBlock} testID={`${testID}-driver`}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <Ionicons
                name="person"
                size={AVATAR_ICON_SIZE}
                color={colors.accent}
              />
            </View>
            <View style={styles.driverText}>
              <Text style={styles.driverLabel}>DRIVER</Text>
              <Text style={styles.driverName} numberOfLines={1}>
                {driver?.name ?? 'Assigned'}
              </Text>
              {driverPhone ? (
                <View style={styles.driverPhoneRow}>
                  <Ionicons
                    name="logo-whatsapp"
                    size={PHONE_ICON_SIZE}
                    color={colors.whatsapp}
                  />
                  <Text
                    style={styles.driverPhone}
                    numberOfLines={1}
                    testID={`${testID}-driver-phone`}
                  >
                    {driverPhone}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {driverPhone && !isTerminal ? (
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                pressed && styles.pressed,
              ]}
              onPress={handleContactDriver}
              accessibilityRole="button"
              accessibilityLabel={`Message ${
                driver?.name ?? 'the driver'
              } on ${driverPhone} on WhatsApp`}
              accessibilityHint="Opens WhatsApp"
              hitSlop={4}
              testID={`${testID}-driver-whatsapp`}
            >
              <Ionicons
                name="logo-whatsapp"
                size={ICON_SIZE}
                color={colors.whatsapp}
              />
              <Text style={styles.contactText}>Message driver</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.detail}>
        <Text style={styles.detailLabel}>DROP-OFF</Text>
        <Text style={styles.detailValue} numberOfLines={2}>
          {card.dropoff}
        </Text>
      </View>

      {card.customerPhone ? (
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>CUSTOMER</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {card.customerPhone}
          </Text>
        </View>
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
