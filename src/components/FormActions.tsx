import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '../theme';
import { useThemedStyles } from '../theme/useThemedStyles';

type FormActionsProps = {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
};

export function FormActions({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryLoading = false,
  primaryDisabled = false,
}: FormActionsProps) {
  const styles = useThemedStyles(createStyles);

  const handlePrimary = useCallback(() => {
    if (!primaryLoading && !primaryDisabled) {
      onPrimary();
    }
  }, [onPrimary, primaryLoading, primaryDisabled]);

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={handlePrimary}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
          (primaryLoading || primaryDisabled) && styles.primaryButtonDisabled,
        ]}
      >
        {primaryLoading ? (
          <ActivityIndicator color={styles.primaryButtonText.color} />
        ) : (
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={onSecondary}
        disabled={primaryLoading}
        style={({ pressed }) => [
          styles.outlineButton,
          pressed && styles.outlineButtonPressed,
          primaryLoading && styles.outlineButtonDisabled,
        ]}
      >
        <Text style={styles.outlineButtonText}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actions: {
      padding: 16,
      gap: 8,
    },
    primaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.small,
      paddingVertical: 13,
      minHeight: 48,
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    primaryButtonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
    outlineButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: theme.radii.small,
      paddingVertical: 13,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    outlineButtonPressed: {
      opacity: 0.85,
    },
    outlineButtonDisabled: {
      borderColor: theme.colors.disabled,
    },
    outlineButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
  });
