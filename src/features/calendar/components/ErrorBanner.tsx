import React, { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme, useThemedStyles } from '../../../theme';

type ErrorBannerProps = {
  message: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
};

export function ErrorBanner({ message, onDismiss, autoDismissMs = 5000 }: ErrorBannerProps) {
  const styles = useThemedStyles(createStyles);
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [message, onDismiss, autoDismissMs, animatedOpacity]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { opacity: animatedOpacity }]}>
      <View style={styles.banner}>
        <Text style={styles.text}>{message}</Text>
        <Pressable onPress={onDismiss} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.semantic.error.bg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.semantic.error.text,
  },
  text: {
    flex: 1,
    color: theme.colors.semantic.error.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
  },
  closeButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.semantic.error.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
