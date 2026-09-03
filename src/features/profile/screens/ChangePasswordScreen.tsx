import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormActions } from '../../../components/FormActions';
import { FormField } from '../../../components/FormField';
import { FormSection } from '../../../components/FormSection';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { useFeedback } from '../../../state/FeedbackContext';
import { useAuth } from '../../../state/AuthContext';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';

const MIN_PASSWORD_LENGTH = 6;

type ChangePasswordScreenProps = {
  onBack: () => void;
};

export function ChangePasswordScreen({ onBack }: ChangePasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const { changePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      showFeedback({
        type: 'error',
        message: `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      });
      return;
    }

    if (password !== confirm) {
      showFeedback({ type: 'error', message: 'Las contrasenas no coinciden.' });
      return;
    }

    setSaving(true);
    try {
      await changePassword(password);
      showFeedback({ type: 'success', message: 'Contrasena actualizada correctamente.' });
      onBack();
    } catch (saveError) {
      showFeedback({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo actualizar la contrasena.',
      });
    } finally {
      setSaving(false);
    }
  }, [saving, password, confirm, changePassword, showFeedback, onBack]);

  return (
    <ScreenWrapper title="Cambiar contrasena" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>
            La contrasena debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.
          </Text>
        </View>

        <FormSection title="Nueva contrasena">
          <FormField
            label="Nueva contrasena"
            value={password}
            onChangeText={setPassword}
            placeholder="Nueva contrasena"
            secureTextEntry
            autoCapitalize="none"
          />
          <FormField
            label="Confirmar contrasena"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repetir contrasena"
            secureTextEntry
            autoCapitalize="none"
          />
        </FormSection>

        <FormActions
          primaryLabel="Guardar contrasena"
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
    header: {
      marginHorizontal: 16,
      marginBottom: 12,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: theme.radii.large,
      backgroundColor: theme.colors.surface,
    },
    headerText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
      lineHeight: 20,
    },
  });
