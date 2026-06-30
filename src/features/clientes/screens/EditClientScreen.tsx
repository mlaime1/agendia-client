import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormActions } from '../../../components/FormActions';
import { FormField } from '../../../components/FormField';
import { FormSection } from '../../../components/FormSection';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useFeedback } from '../../../state/FeedbackContext';
import { useClientDetail } from '../hooks';

const toDigits = (value: string): string => value.replace(/\D/g, '');

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

type EditClientScreenProps = {
  clientId: string;
  onBack: () => void;
  onSave: () => void;
};

export function EditClientScreen({ clientId, onBack, onSave }: EditClientScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const { client, loading, error, refetch, updateClient } = useClientDetail(clientId);

  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setNombre(client.nombre);
      setPhone(client.phone);
    }
  }, [client]);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(toDigits(value));
  }, []);

  const handleSave = useCallback(async () => {
    if (!client || saving) return;

    if (!nombre.trim()) {
      showFeedback({ type: 'error', message: 'El nombre es obligatorio.' });
      return;
    }
    if (!phone.trim()) {
      showFeedback({ type: 'error', message: 'El teléfono es obligatorio.' });
      return;
    }

    setSaving(true);
    try {
      await updateClient({
        nombre: nombre.trim(),
        phone: phone.trim(),
      });
      showFeedback({ type: 'success', message: 'Cliente actualizado correctamente.' });
      onSave();
    } catch (saveError) {
      showFeedback({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo actualizar el cliente.',
      });
    } finally {
      setSaving(false);
    }
  }, [client, saving, nombre, phone, updateClient, showFeedback, onSave]);

  if (loading) {
    return (
      <ScreenWrapper title="Editar cliente" onBackPress={onBack}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loadingColor.color} />
          <Text style={styles.loadingText}>Cargando cliente...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !client) {
    return (
      <ScreenWrapper title="Editar cliente" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Cliente no encontrado'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const initial = getInitial(nombre || client.nombre);

  return (
    <ScreenWrapper title="Editar cliente" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.heroName}>{client.nombre}</Text>
        </View>

        <FormSection title="Datos personales">
          <FormField
            label="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre completo"
            autoCapitalize="words"
          />
          <FormField
            label="Teléfono"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Teléfono"
            keyboardType="number-pad"
            maxLength={15}
          />
        </FormSection>

        <FormActions
          primaryLabel="Guardar cambios"
          onPrimary={handleSave}
          secondaryLabel="Cancelar"
          onSecondary={onBack}
          primaryLoading={saving}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingTop: 10,
      paddingBottom: 40,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    loadingColor: {
      color: theme.colors.primary,
    },
    loadingText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.textSubtle,
      fontWeight: theme.typography.weight.medium,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.typography.size.md,
    },
    hero: {
      alignItems: 'center',
      paddingVertical: 22,
      paddingHorizontal: 20,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textInverse,
    },
    heroName: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
      fontWeight: theme.typography.weight.medium,
    },
  });
