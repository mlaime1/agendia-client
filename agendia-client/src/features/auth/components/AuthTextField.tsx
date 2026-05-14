import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({ label, ...textInputProps }: AuthTextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor="#8C9A91"
        style={styles.input}
        {...textInputProps}
      />
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
});
