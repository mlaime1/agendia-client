import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Pressable } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({ label, ...textInputProps }: AuthTextFieldProps) {
  const { secureTextEntry, style, ...rest } = textInputProps as any;
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [secure, setSecure] = useState<boolean>(!!secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize="none"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.input, secureTextEntry ? styles.inputWithIcon : null, style]}
          secureTextEntry={secure}
          {...rest}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setSecure((s) => !s)} style={styles.iconButton} accessibilityLabel="Toggle password visibility">
            <AppIcon name={secure ? 'eyeOff' : 'eye'} size={20} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  field: {
    gap: 7,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 14,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  iconButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -16 }],
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
