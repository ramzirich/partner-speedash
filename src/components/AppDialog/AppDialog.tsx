import React, { memo, useCallback } from 'react';
import { Animated, Modal, Text, View } from 'react-native';
import { AppButton } from '../AppButton';
import { useAppDialogAnimation } from './useAppDialogAnimation';
import { styles } from './AppDialog.styles';

export type AppDialogTone = 'default' | 'danger' | 'success';

export interface AppDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  /** Spinner on the confirm button while the action is in flight. */
  confirmLoading?: boolean;
  tone?: AppDialogTone;
  testID?: string;
}

const AppDialogComponent: React.FC<AppDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  onConfirm,
  cancelLabel,
  onCancel,
  confirmLoading = false,
  tone = 'default',
  testID,
}) => {
  const { rendered, scrimStyle, cardStyle } = useAppDialogAnimation(visible);

  const handleRequestClose = useCallback(() => {
    if (confirmLoading) {
      return;
    }
    (onCancel ?? onConfirm)();
  }, [confirmLoading, onCancel, onConfirm]);

  if (!rendered) {
    return null;
  }

  const titleStyle = [
    styles.title,
    tone === 'danger' && styles.titleDanger,
    tone === 'success' && styles.titleSuccess,
  ];

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleRequestClose}>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Animated.View
          style={[styles.card, cardStyle]}
          accessibilityViewIsModal
          accessibilityRole="alert"
          testID={testID}>
          <Text style={titleStyle}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton
              label={confirmLabel}
              variant={tone === 'danger' ? 'danger' : 'primary'}
              fullWidth
              loading={confirmLoading}
              onPress={onConfirm}
              testID={testID ? `${testID}-confirm` : undefined}
            />
            {cancelLabel && onCancel ? (
              <AppButton
                label={cancelLabel}
                variant="ghost"
                fullWidth
                disabled={confirmLoading}
                onPress={onCancel}
                testID={testID ? `${testID}-cancel` : undefined}
              />
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const AppDialog = memo(AppDialogComponent);
AppDialog.displayName = 'AppDialog';