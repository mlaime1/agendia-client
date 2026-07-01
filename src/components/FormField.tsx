import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Theme } from '../theme';
import { useThemedStyles } from '../theme/useThemedStyles';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  maxLength,
  autoCapitalize,
  editable = true,
}: FormFieldProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={styles.placeholderColor.color}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'auto'}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    field: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    label: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textSubtle,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
    },
    textarea: {
      minHeight: 72,
      lineHeight: 18,
    },
    placeholderColor: {
      color: theme.colors.textSubtle,
    },
  });
