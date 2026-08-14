import React, { memo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton } from '../AppButton';
import { LiveOrderTracker } from '../LiveOrderTracker';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import type { OrderDocument, OrderDocumentStatus } from '../../api';
import { colors } from '../../theme';
import { styles } from './OrderDetailsSheet.styles';

const CLOSE_ICON_SIZE = 20;

export interface OrderDetailsSheetProps {
  orderId: string | null;
  onClose: () => void;
  onStatusChange?: (status: OrderDocumentStatus, order: OrderDocument) => void;
  testID?: string;
}

const OrderDetailsSheetComponent: React.FC<OrderDetailsSheetProps> = ({
  orderId,
  onClose,
  onStatusChange,
  testID = 'order-details-sheet',
}) => {
  const tracking = useOrderTracking(orderId, { onStatusChange });
  const waiting = tracking.order === null;
  const failed = waiting && tracking.error !== null;

  return (
    <Modal
      transparent
      visible={orderId !== null}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close order details"
        />

        <View style={styles.sheet} accessibilityViewIsModal testID={testID}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Order details</Text>
            <Pressable
              style={({ pressed }) => [
                styles.close,
                pressed && styles.closePressed,
              ]}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID={`${testID}-close`}
            >
              <Ionicons
                name="close"
                size={CLOSE_ICON_SIZE}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {waiting ? (
              <View style={styles.waiting} testID={`${testID}-loading`}>
                {failed ? null : <ActivityIndicator color={colors.primary} />}
                <Text
                  style={[styles.waitingText, failed && styles.waitingError]}
                >
                  {tracking.error ?? 'Loading this order…'}
                </Text>
              </View>
            ) : (
              <LiveOrderTracker
                order={tracking.order}
                status={tracking.status}
                card={tracking.card}
                isConnected={tracking.isConnected}
                times={tracking.times}
                error={tracking.error}
                testID={`${testID}-tracker`}
              />
            )}

            <AppButton
              label="Close"
              variant="outline"
              fullWidth
              onPress={onClose}
              testID={`${testID}-dismiss`}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const OrderDetailsSheet = memo(OrderDetailsSheetComponent);
OrderDetailsSheet.displayName = 'OrderDetailsSheet';
