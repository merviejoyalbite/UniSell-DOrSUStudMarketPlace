import { Alert, Platform } from 'react-native';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation dialog that also works on web.
 *
 * React Native Web turns `Alert.alert` into a no-op, so destructive actions
 * use the browser dialog on web and the native alert elsewhere.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmOptions) {
  if (Platform.OS === 'web') {
    const confirm = (
      globalThis as { confirm?: (message: string) => boolean }
    ).confirm;
    if (typeof confirm === 'function') {
      if (confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
