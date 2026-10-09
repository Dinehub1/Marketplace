import { Alert, Platform } from 'react-native';

/**
 * Alert.alert is a no-op in react-native-web, so on web a confirmation would never appear and its
 * action would never run. These fall back to the browser's own dialogs there.
 */
export function confirm(
  title: string,
  message: string,
  action: { text: string; destructive?: boolean; onPress: () => void },
  cancelText = 'Cancel',
) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) action.onPress();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: action.text, style: action.destructive ? 'destructive' : 'default', onPress: action.onPress },
  ]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
