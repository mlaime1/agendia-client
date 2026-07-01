import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Theme, useThemedStyles } from '../../../theme';

export interface FormRate {
  type: 'ida' | 'ida y vuelta' | 'especial';
  price: string;
}

export type RatesFormRef = {
  focusFirst: () => void;
};

type RatesFormProps = {
  rates: FormRate[];
  onUpdateRate: (type: FormRate['type'], price: string) => void;
};

const RATE_LABELS: Record<FormRate['type'], { label: string; color: string }> = {
  'ida': { label: 'Ida', color: '#C8EDD8' },
  'ida y vuelta': { label: 'Ida y vta', color: '#C8DCF0' },
  'especial': { label: 'Especial', color: '#FDE8B8' },
};

const RATE_TEXT_COLORS: Record<FormRate['type'], string> = {
  'ida': '#1B5E3B',
  'ida y vuelta': '#1B4A7A',
  'especial': '#9A5F00',
};

export const RatesForm = forwardRef<RatesFormRef, RatesFormProps>(
  function RatesForm({ rates, onUpdateRate }, ref) {
    const styles = useThemedStyles(createStyles);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focusFirst: () => {
        inputRefs.current[0]?.focus();
      },
    }));

    return (
      <View style={styles.ratesGrid}>
        {rates.map((rate, index) => {
          const config = RATE_LABELS[rate.type];
          const isOptional = rate.type === 'especial';
          const isLast = index === rates.length - 1;

          return (
            <View key={rate.type} style={styles.rateRow}>
              <View style={styles.rateTag}>
                <View
                  style={[
                    styles.ratePill,
                    { backgroundColor: config.color },
                  ]}
                >
                  <Text style={[styles.ratePillText, { color: RATE_TEXT_COLORS[rate.type] }]}>
                    {config.label}
                  </Text>
                </View>
                {isOptional && (
                  <Text style={styles.rateOptional}>Opcional</Text>
                )}
              </View>
              <View style={styles.rateInputWrap}>
                <Text style={styles.ratePrefix}>$</Text>
                <TextInput
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  style={styles.rateInput}
                  placeholder={isOptional ? '—' : '0'}
                  placeholderTextColor={styles.placeholder.color}
                  value={rate.price}
                  onChangeText={(text) => onUpdateRate(rate.type, text)}
                  keyboardType="number-pad"
                  returnKeyType={isLast ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (isLast) {
                      Keyboard.dismiss();
                    } else {
                      inputRefs.current[index + 1]?.focus();
                    }
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  }
);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    ratesGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    rateTag: {
      minWidth: 82,
      display: 'flex',
      alignItems: 'center',
      gap: 3,
    },
    ratePill: {
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.sm,
    },
    ratePillText: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
    },
    rateOptional: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textSubtle,
      fontWeight: theme.typography.weight.medium,
      textAlign: 'center',
    },
    rateInputWrap: {
      flex: 1,
      position: 'relative',
    },
    ratePrefix: {
      position: 'absolute',
      left: 13,
      top: '50%',
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.textMuted,
    },
    rateInput: {
      width: '100%',
      paddingVertical: theme.spacing.md,
      paddingLeft: 26,
      paddingRight: theme.spacing.md,
      borderRadius: theme.radii.small,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    placeholder: {
      color: theme.colors.textSubtle,
    },
  });
