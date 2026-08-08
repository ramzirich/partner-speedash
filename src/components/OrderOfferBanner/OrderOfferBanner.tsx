import React, { memo, useCallback } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { DriverNotification, DriverNotificationType } from '../../api';
import { colors } from '../../theme';
import { useOfferCountdown } from './useOfferCountdown';
import { useOrderOfferBannerAnimation } from './useOrderOfferBannerAnimation';
import { styles } from './OrderOfferBanner.styles';

export interface OrderOfferBannerProps {
  /** Latest driver notification, or null to hide the banner. */
  notification: DriverNotification | null;
  /** Epoch ms deadline for the offer; drives the countdown pill. */
  expiresAt?: number | null;
  /** Tapping the banner — takes the driver to the order. */
  onPress: (notification: DriverNotification) => void;
  onDismiss: () => void;
}

const ICON_SIZE = 22;
const CLOSE_SIZE = 18;

const META: Record<
  DriverNotificationType,
  { title: string; icon: string; danger?: boolean }
> = {
  NEW_ORDER_OFFER: { title: 'New order offer', icon: 'bicycle' },
  FORCE_ASSIGNED_ORDER: { title: 'Order assigned to you', icon: 'flash' },
  ORDER_CANCELED: {
    title: 'Order canceled',
    icon: 'close-circle',
    danger: true,
  },
};

/**
 * The in-app notification for a pushed order. Sits above the Home content, shows
 * the server's message plus the seconds left to respond, and leads to the order
 * when tapped.
 */
const OrderOfferBannerComponent: React.FC<OrderOfferBannerProps> = ({
  notification,
  expiresAt = null,
  onPress,
  onDismiss,
}) => {
  const animatedStyle = useOrderOfferBannerAnimation(
    notification ? `${notification.type}:${notification.orderId}` : null,
  );
  const secondsLeft = useOfferCountdown(expiresAt);

  const handlePress = useCallback(() => {
    if (notification) {
      onPress(notification);
    }
  }, [notification, onPress]);

  if (!notification) {
    return null;
  }

  const meta = META[notification.type];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        meta.danger ? styles.wrapperDanger : null,
        animatedStyle,
      ]}
      accessibilityLiveRegion="assertive">
      <Pressable
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${meta.title}. ${notification.message} Tap to open the order.`}
        hitSlop={8}
        testID="order-offer-banner">
        <View style={styles.iconWrap}>
          <Ionicons
            name={meta.icon}
            size={ICON_SIZE}
            color={colors.textOnPrimary}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {meta.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.hint}>Tap to view in Orders</Text>
        </View>

        {secondsLeft !== null ? (
          <View style={styles.countdown}>
            <Text style={styles.countdownText}>{`${secondsLeft}s`}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={10}
        testID="order-offer-banner-dismiss">
        <Ionicons
          name="close"
          size={CLOSE_SIZE}
          color={colors.textOnPrimary}
        />
      </Pressable>
    </Animated.View>
  );
};

export const OrderOfferBanner = memo(OrderOfferBannerComponent);
OrderOfferBanner.displayName = 'OrderOfferBanner';
