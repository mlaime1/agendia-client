import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { Theme, useThemedStyles } from '../../../theme';

type CollapsibleSectionProps = {
  number?: number;
  isDone?: boolean;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function CollapsibleSection({
  number,
  isDone,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Pressable
        style={[styles.sectionToggle, isOpen && styles.sectionToggleOpen]}
        onPress={onToggle}
      >
        <View
          style={[
            styles.sectionNum,
            isDone && styles.sectionNumDone,
          ]}
        >
          {isDone ? (
            <AppIcon name="check" size={14} color={styles.checkIcon.color} />
          ) : (
            <Text style={styles.sectionNumText}>{number}</Text>
          )}
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && (
            <Text style={[styles.sectionSub, isDone && styles.sectionSubFilled]}>
              {subtitle}
            </Text>
          )}
        </View>
        <AppIcon
          name="chevronDown"
          size={18}
          color={styles.chevron.color}
          style={[isOpen && styles.chevronOpen]}
        />
      </Pressable>

      {isOpen && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.large,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    sectionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    sectionToggleOpen: {
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    sectionNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    sectionNumDone: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    sectionNumText: {
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primary,
    },
    checkIcon: {
      color: theme.colors.primary,
    },
    sectionInfo: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
    },
    sectionSub: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weight.medium,
      marginTop: 2,
    },
    sectionSubFilled: {
      color: theme.colors.text,
      fontWeight: theme.typography.weight.semibold,
    },
    chevron: {
      color: theme.colors.textSubtle,
    },
    chevronOpen: {
      transform: [{ rotate: '180deg' }],
    },
    sectionBody: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.md,
      display: 'flex',
    },
  });
