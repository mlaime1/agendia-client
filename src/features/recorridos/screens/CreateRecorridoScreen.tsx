import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { Theme, useThemedStyles } from '../../../theme';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { StopsForm, type FormStop } from '../components/StopsForm';
import { RatesForm, type FormRate } from '../components/RatesForm';
import { useCreateItinerary } from '../hooks/useCreateItinerary';

type CreateRecorridoScreenProps = {
  onBack: () => void;
  onMenuPress?: () => void;
  clientId: string;
};

export function CreateRecorridoScreen({
  onBack,
  onMenuPress,
  clientId,
}: CreateRecorridoScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { creating, error, create } = useCreateItinerary();

  const [routeName, setRouteName] = useState('');
  const [stops, setStops] = useState<FormStop[]>([
    {
      id: 'origin-1',
      name: '',
      address: '',
      type: 'origin',
    },
    {
      id: 'destination-1',
      name: '',
      address: '',
      type: 'destination',
    },
  ]);
  const [rates, setRates] = useState<FormRate[]>([
    { type: 'ida', price: '' },
    { type: 'ida y vuelta', price: '' },
    { type: 'especial', price: '' },
  ]);

  const [expandedSections, setExpandedSections] = useState({
    name: true,
    stops: true,
    rates: true,
  });

  const isNameFilled = routeName.trim().length > 0;
  const hasValidStops = stops.every((s) => s.address.trim().length > 0);
  const hasValidRates = rates.some((r) => r.price.trim().length > 0);
  const canCreate = isNameFilled && hasValidStops && hasValidRates;

  const handleAddStop = () => {
    const newId = `stop-${Date.now()}`;
    const newStop: FormStop = {
      id: newId,
      name: '',
      address: '',
      type: 'stop',
    };
    const updatedStops = [...stops];
    const destIndex = updatedStops.findIndex((s) => s.type === 'destination');
    updatedStops.splice(destIndex, 0, newStop);
    setStops(updatedStops);
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleUpdateStop = (id: string, name: string, address: string) => {
    setStops(
      stops.map((s) =>
        s.id === id ? { ...s, name, address } : s
      )
    );
  };

  const handleUpdateRate = (type: FormRate['type'], price: string) => {
    setRates(
      rates.map((r) =>
        r.type === type ? { ...r, price } : r
      )
    );
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    const stopsPayload = stops.map((s, idx) => ({
      address: s.address.trim(),
      stop_order: idx + 1,
    }));

    const ratesPayload = rates
      .filter((r) => r.price.trim().length > 0)
      .map((r) => ({
        trip_type: r.type,
        base_price: parseInt(r.price.replace(/[^\d]/g, ''), 10),
      }));

    try {
      await create(
        { name: routeName.trim(), client_id: clientId },
        stopsPayload,
        ratesPayload,
      );
      onBack();
    } catch {
      // error ya está en el hook
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
        >
          <AppIcon name="back" size={20} color={styles.headerIcon.color} />
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo recorrido</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <AppIcon name="alert" size={16} color={styles.errorIcon.color} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <CollapsibleSection
          isDone={isNameFilled}
          title="Nombre"
          subtitle={isNameFilled ? routeName : undefined}
          isOpen={expandedSections.name}
          onToggle={() =>
            setExpandedSections((prev) => ({ ...prev, name: !prev.name }))
          }
        >
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre del recorrido</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Casa → Escuela"
              placeholderTextColor={styles.placeholder.color}
              value={routeName}
              onChangeText={setRouteName}
            />
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          number={2}
          title="Paradas"
          subtitle="Origen, intermedias y destino"
          isOpen={expandedSections.stops}
          onToggle={() =>
            setExpandedSections((prev) => ({ ...prev, stops: !prev.stops }))
          }
        >
          <StopsForm
            stops={stops}
            onUpdateStop={handleUpdateStop}
            onRemoveStop={handleRemoveStop}
            onAddStop={handleAddStop}
          />
        </CollapsibleSection>

        <CollapsibleSection
          number={3}
          title="Tarifas"
          subtitle="Precio por tipo de viaje"
          isOpen={expandedSections.rates}
          onToggle={() =>
            setExpandedSections((prev) => ({ ...prev, rates: !prev.rates }))
          }
        >
          <RatesForm rates={rates} onUpdateRate={handleUpdateRate} />
        </CollapsibleSection>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            (!canCreate || creating) && styles.createButtonDisabled,
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreate}
          disabled={!canCreate || creating}
        >
          {creating ? (
            <Text style={[styles.createButtonText, styles.createButtonTextDisabled]}>
              Creando...
            </Text>
          ) : (
            <>
              <AppIcon
                name="check"
                size={20}
                color={canCreate ? styles.createButtonIcon.color : styles.createButtonIconDisabled.color}
              />
              <Text
                style={[
                  styles.createButtonText,
                  !canCreate && styles.createButtonTextDisabled,
                ]}
              >
                Crear recorrido
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: theme.radii.large,
      borderBottomRightRadius: theme.radii.large,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: theme.radii.small,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerIcon: {
      color: theme.colors.primary,
    },
    headerTitle: {
      fontSize: theme.typography.size.lg,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primary,
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
      paddingBottom: 120,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.semantic.error.bg,
      borderWidth: 1,
      borderColor: theme.colors.semantic.error.border,
      borderRadius: theme.radii.medium,
      padding: theme.spacing.md,
    },
    errorIcon: {
      color: theme.colors.semantic.error.text,
    },
    errorText: {
      flex: 1,
      fontSize: theme.typography.size.sm,
      color: theme.colors.semantic.error.text,
      fontWeight: theme.typography.weight.medium,
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
    },
    fieldLabel: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    input: {
      width: '100%',
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
    ctaContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      width: '100%',
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.medium,
    },
    createButtonDisabled: {
      backgroundColor: `${theme.colors.primary}40`,
    },
    createButtonPressed: {
      opacity: 0.85,
    },
    createButtonIcon: {
      color: theme.colors.primaryLight,
    },
    createButtonIconDisabled: {
      color: `${theme.colors.primaryLight}80`,
    },
    createButtonText: {
      fontSize: theme.typography.size.lg,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primaryLight,
    },
    createButtonTextDisabled: {
      opacity: 0.6,
    },
  });
