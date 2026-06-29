import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, onPress: onConfirm },
  ]);
}
