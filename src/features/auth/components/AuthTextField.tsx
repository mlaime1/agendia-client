import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({ label, ...textInputProps }: AuthTextFieldProps) {
  const { secureTextEntry, style, ...rest } = textInputProps as any;
  const [secure, setSecure] = useState<boolean>(!!secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize="none"
          placeholderTextColor="#8C9A91"
          style={[styles.input, secureTextEntry ? styles.inputWithIcon : null, style]}
          secureTextEntry={secure}
          {...rest}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setSecure((s) => !s)} style={styles.iconButton} accessibilityLabel="Toggle password visibility">
            <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color="#637269" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },
  label: {
    color: '#314139',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D6E1D8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#233329',
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
