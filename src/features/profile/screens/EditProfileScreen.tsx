import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormActions } from '../../../components/FormActions';
import { FormField } from '../../../components/FormField';
import { FormSection } from '../../../components/FormSection';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { useFeedback } from '../../../state/FeedbackContext';
import { useAuth } from '../../../state/AuthContext';
import type { UpdateUserDto } from '../../../services/types';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import type { ProfileScreenProps } from '../types';

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

// El backend sanitiza y valida entre 7 y 15 digitos; se repite la validacion
// aca para dar feedback inmediato sin round-trip.
function validatePhone(value: string): string | null {
  const cleaned = value.trim().replace(/[\s\-().]/g, '');

  if (!cleaned) {
    return null;
  }

  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  if (!/^\+?\d+$/.test(cleaned) || digits.length < 7 || digits.length > 15) {
    return 'El telefono debe tener entre 7 y 15 digitos (puede incluir el prefijo +).';
  }

  return null;
}

type EditProfileScreenProps = Pick<ProfileScreenProps, 'userProfile'> & {
  onBack: () => void;
};

export function EditProfileScreen({ userProfile, onBack }: EditProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const { updateProfile } = useAuth();

  const [nombre, setNombre] = useState(userProfile.name);
  const [alias, setAlias] = useState(userProfile.alias ?? '');
  const [phone, setPhone] = useState(userProfile.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (!nombre.trim()) {
      showFeedback({ type: 'error', message: 'El nombre es obligatorio.' });
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      showFeedback({ type: 'error', message: phoneError });
      return;
    }

    setSaving(true);
    try {
      const body: UpdateUserDto = {
        name: nombre.trim(),
        alias: alias.trim(),
      };

      if (phone.trim()) {
        body.phone = phone.trim();
      }

      await updateProfile(body);
      showFeedback({ type: 'success', message: 'Perfil actualizado correctamente.' });
      onBack();
    } catch (saveError) {
      showFeedback({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo actualizar el perfil.',
      });
    } finally {
      setSaving(false);
    }
  }, [saving, nombre, alias, phone, updateProfile, showFeedback, onBack]);

  return (
    <ScreenWrapper title="Editar perfil" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(nombre || userProfile.name)}</Text>
          </View>
          <Text style={styles.heroName}>{userProfile.email}</Text>
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
            label="Alias"
            value={alias}
            onChangeText={setAlias}
            placeholder="Alias (opcional)"
            autoCapitalize="words"
          />
          <FormField
            label="Telefono"
            value={phone}
            onChangeText={setPhone}
            placeholder="Ej: +54 9 11 2233-4455"
            keyboardType="phone-pad"
            maxLength={25}
          />
        </FormSection>

        <FormActions
          primaryLabel="Guardar cambios"
          onPrimary={() => {
            void handleSave();
          }}
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
