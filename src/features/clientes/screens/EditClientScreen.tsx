import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { MOCK_CLIENTS } from '../mockData';

type EditClientScreenProps = {
  clientId: string;
  onBack: () => void;
  onSave: () => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

export function EditClientScreen({ clientId, onBack, onSave }: EditClientScreenProps) {
  const styles = useThemedStyles(createStyles);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId);

  const [nombre, setNombre] = useState(client?.nombre || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [address, setAddress] = useState(client?.address || '');
  const [observations, setObservations] = useState(client?.observations || '');

  if (!client) {
    return (
      <ScreenWrapper title="Editar cliente" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Cliente no encontrado</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const initial = getInitial(client.nombre);

  return (
    <ScreenWrapper title="Editar cliente" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.heroName}>{client.nombre}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos personales</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre completo"
              placeholderTextColor={styles.placeholderColor.color}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Teléfono"
              placeholderTextColor={styles.placeholderColor.color}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Dirección"
              placeholderTextColor={styles.placeholderColor.color}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Observaciones</Text>
            <TextInput
              style={styles.textarea}
              value={observations}
              onChangeText={setObservations}
              placeholder="Observaciones"
              placeholderTextColor={styles.placeholderColor.color}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={onSave}
          >
            <AppIcon name="check" size={18} color={styles.primaryButtonText.color} />
            <Text style={styles.primaryButtonText}>Guardar cambios</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
            onPress={onBack}
          >
            <Text style={styles.outlineButtonText}>Cancelar</Text>
          </Pressable>
        </View>
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
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
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
      fontWeight: '700',
      color: theme.colors.primaryLight,
    },
    heroName: {
      fontSize: 12,
      color: theme.colors.textSubtle,
      fontWeight: '500',
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      marginHorizontal: 16,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 4,
    },
    field: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
    textarea: {
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.colors.text,
      minHeight: 72,
      lineHeight: 18,
    },
    placeholderColor: {
      color: theme.colors.textSubtle,
    },
    actions: {
      padding: 16,
      gap: 8,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonText: {
      color: theme.colors.primaryLight,
      fontSize: 14,
      fontWeight: '600',
    },
    outlineButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 13,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    outlineButtonPressed: {
      opacity: 0.85,
    },
    outlineButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
