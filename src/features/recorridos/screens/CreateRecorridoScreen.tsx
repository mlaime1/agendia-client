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

type CreateRecorridoScreenProps = {
  onBack: () => void;
  onMenuPress?: () => void;
};

export function CreateRecorridoScreen({
  onBack,
  onMenuPress,
}: CreateRecorridoScreenProps) {
  const styles = useThemedStyles(createStyles);

  const [routeName, setRouteName] = useState('');
  const [stops, setStops] = useState<FormStop[]>([
    {
      id: 'origin-1',
      name: 'Casa de Andrea',
      address: 'Av. Rivadavia 4521, CABA',
      type: 'origin',
    },
    {
      id: 'destination-1',
      name: 'Escuela N°4',
      address: 'Beauchef 1270, CABA',
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

  const handleAddStop = () => {
    const newId = `stop-${Date.now()}`;
    const newStop: FormStop = {
      id: newId,
      name: '',
      address: '',
      type: 'stop',
    };
    const updatedStops = [...stops];
    // Insert before destination
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

  const handleCreate = () => {
    // For now, just log. Backend integration will happen later.
    console.log('Creating route:', { routeName, stops, rates });
    onBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Name section */}
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

        {/* Stops section */}
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

        {/* Rates section */}
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

      {/* Create button */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            !isNameFilled && styles.createButtonDisabled,
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreate}
          disabled={!isNameFilled}
        >
          <AppIcon
            name="check"
            size={20}
            color={isNameFilled ? styles.createButtonIcon.color : styles.createButtonIconDisabled.color}
          />
          <Text
            style={[
              styles.createButtonText,
              !isNameFilled && styles.createButtonTextDisabled,
            ]}
          >
            Crear recorrido
          </Text>
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
