import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { Theme, useThemedStyles } from '../../../theme';

export interface FormStop {
  id: string;
  name: string;
  address: string;
  type: 'origin' | 'destination' | 'stop';
}

export type StopsFormRef = {
  focusFirst: () => void;
};

type StopsFormProps = {
  stops: FormStop[];
  onUpdateStop: (id: string, name: string, address: string) => void;
  onRemoveStop: (id: string) => void;
  onAddStop: () => void;
};

export const StopsForm = forwardRef<StopsFormRef, StopsFormProps>(
  function StopsForm({ stops, onUpdateStop, onRemoveStop, onAddStop }, ref) {
    const styles = useThemedStyles(createStyles);
    const nameRefs = useRef<(TextInput | null)[]>([]);
    const addressRefs = useRef<(TextInput | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focusFirst: () => {
        nameRefs.current[0]?.focus();
      },
    }));

    const getStopLabel = (type: FormStop['type'], index: number) => {
      if (type === 'origin') return 'Origen';
      if (type === 'destination') return 'Destino';
      return `Parada ${index}`;
    };

    const focusAddress = (index: number) => {
      addressRefs.current[index]?.focus();
    };

    const focusNextName = (index: number) => {
      const nextName = nameRefs.current[index + 1];
      if (nextName) {
        nextName.focus();
      } else {
        Keyboard.dismiss();
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.stopsList}>
          {stops.map((stop, idx) => {
            const isFirst = stop.type === 'origin';
            const isLast = stop.type === 'destination';
            const isMid = !isFirst && !isLast;

            return (
              <View key={stop.id} style={styles.stopItem}>
                <View style={styles.stopAside}>
                  {isFirst || isLast ? (
                    <View style={styles.stopDot} />
                  ) : (
                    <View style={styles.stopDotMid} />
                  )}
                  {!isLast && <View style={styles.stopLine} />}
                </View>
                <View style={styles.stopFields}>
                  <View style={styles.stopHeader}>
                    <Text style={styles.stopLabel}>{getStopLabel(stop.type, idx)}</Text>
                    {isMid && (
                      <Pressable
                        style={styles.stopRemove}
                        onPress={() => onRemoveStop(stop.id)}
                      >
                        <AppIcon name="close" size={13} color={styles.removeIcon.color} />
                      </Pressable>
                    )}
                  </View>
                  <TextInput
                    ref={(el) => {
                      nameRefs.current[idx] = el;
                    }}
                    style={styles.input}
                    placeholder="Nombre del lugar"
                    placeholderTextColor={styles.placeholder.color}
                    value={stop.name}
                    onChangeText={(text) => onUpdateStop(stop.id, text, stop.address)}
                    returnKeyType="next"
                    onSubmitEditing={() => focusAddress(idx)}
                  />
                  <TextInput
                    ref={(el) => {
                      addressRefs.current[idx] = el;
                    }}
                    style={styles.input}
                    placeholder="Dirección"
                    placeholderTextColor={styles.placeholder.color}
                    value={stop.address}
                    onChangeText={(text) => onUpdateStop(stop.id, stop.name, text)}
                    returnKeyType={isLast ? 'done' : 'next'}
                    onSubmitEditing={() => focusNextName(idx)}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Pressable style={styles.addStop} onPress={onAddStop}>
          <View style={styles.addIcon}>
            <AppIcon name="plus" size={14} color={styles.addIconColor.color} />
          </View>
          <Text style={styles.addLabel}>Agregar parada intermedia</Text>
        </Pressable>
      </View>
    );
  }
);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
    },
    stopsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    },
    stopItem: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'stretch',
    },
    stopAside: {
      flexDirection: 'column',
      alignItems: 'center',
      width: 18,
      flexShrink: 0,
      paddingTop: theme.spacing.md,
    },
    stopDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      flexShrink: 0,
    },
    stopDotMid: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: theme.colors.surface,
      borderWidth: 2.5,
      borderColor: theme.colors.primary,
    },
    stopLine: {
      width: 2,
      flex: 1,
      backgroundColor: `${theme.colors.primary}26`,
      minHeight: 12,
      marginVertical: 3,
    },
    stopFields: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
    },
    stopHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stopLabel: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    stopRemove: {
      width: 24,
      height: 24,
      borderRadius: theme.radii.small,
      backgroundColor: `${theme.colors.danger}14`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeIcon: {
      color: theme.colors.danger,
    },
    input: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.small,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.medium,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    placeholder: {
      color: theme.colors.textSubtle,
    },
    addStop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    addIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: `${theme.colors.primary}4D`,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    addIconColor: {
      color: theme.colors.primary,
    },
    addLabel: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.primary,
    },
  });
