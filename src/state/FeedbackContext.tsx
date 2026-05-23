import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, AppIconName } from '../components/AppIcon';
import { Theme, useTheme, useThemedStyles } from '../theme';

type FeedbackType = 'success' | 'error' | 'info';

type FeedbackPayload = {
  type: FeedbackType;
  message: string;
  durationMs?: number;
};

type FeedbackContextValue = {
  showFeedback: (payload: FeedbackPayload) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
  }

  return context;
}

type FeedbackProviderProps = {
  children: React.ReactNode;
};

const DEFAULT_DURATION_MS = 2800;

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideFeedback = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -14,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setFeedback(null));
  }, [opacity, translateY]);

  const showFeedback = useCallback(
    (payload: FeedbackPayload) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setFeedback(payload);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hideFeedback();
      }, payload.durationMs ?? DEFAULT_DURATION_MS);
    },
    [hideFeedback, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const bannerStyle = useMemo(() => {
    if (!feedback) return null;

    if (feedback.type === 'success') {
      return {
        container: styles.successContainer,
        icon: theme.colors.semantic.success.text,
        text: theme.colors.semantic.success.text,
        iconName: 'checkCircle' as AppIconName,
      };
    }

    if (feedback.type === 'error') {
      return {
        container: styles.errorContainer,
        icon: theme.colors.semantic.error.text,
        text: theme.colors.semantic.error.text,
        iconName: 'alert' as AppIconName,
      };
    }

    return {
      container: styles.infoContainer,
      icon: theme.colors.semantic.info.text,
      text: theme.colors.semantic.info.text,
      iconName: 'info' as AppIconName,
    };
  }, [feedback, styles.errorContainer, styles.infoContainer, styles.successContainer, theme]);

  return (
    <FeedbackContext.Provider value={{ showFeedback }}>
      <View style={styles.root}>
        {children}

        {feedback && bannerStyle ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.bannerWrapper,
              { top: insets.top + 10, opacity, transform: [{ translateY }] },
            ]}
          >
            <Pressable style={[styles.banner, bannerStyle.container]} onPress={hideFeedback}>
              <AppIcon name={bannerStyle.iconName} size={18} color={bannerStyle.icon} />
              <Text style={[styles.bannerText, { color: bannerStyle.text }]}>
                {feedback.message}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </FeedbackContext.Provider>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: {
    flex: 1,
  },
  bannerWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  successContainer: {
    backgroundColor: theme.colors.semantic.success.bg,
    borderColor: theme.colors.semantic.success.border,
  },
  errorContainer: {
    backgroundColor: theme.colors.semantic.error.bg,
    borderColor: theme.colors.semantic.error.border,
  },
  infoContainer: {
    backgroundColor: theme.colors.semantic.info.bg,
    borderColor: theme.colors.semantic.info.border,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
