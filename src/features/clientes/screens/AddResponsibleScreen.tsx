import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../../../components/AppIcon';
import { FormActions } from '../../../components/FormActions';
import { FormSection } from '../../../components/FormSection';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useFeedback } from '../../../state/FeedbackContext';
import { useClientDetail, useCreateInvitation } from '../hooks';
import { formatClientDate, getClientTimezone } from '../../../utils/dateTime';
import { UnauthorizedScreen } from '../../../components/UnauthorizedScreen';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type AddResponsibleScreenProps = {
  clientId: string;
  onBack: () => void;
};

const RELATIONSHIP_OPTIONS = [
  'Mamá',
  'Papá',
  'Tutor/a',
  'Cuidador/a',
  'Familiar',
  'Otro',
];

export function AddResponsibleScreen({ clientId, onBack }: AddResponsibleScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const { client, loading, error } = useClientDetail(clientId);
  const { result, loading: generating, createInvitation } = useCreateInvitation();

  const [name, setName] = useState('');
  const [relationshipIndex, setRelationshipIndex] = useState(-1);
  const [showRelationshipOptions, setShowRelationshipOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const clientTimezone = getClientTimezone(client);

  const handleGenerate = useCallback(async () => {
    if (!name.trim()) {
      showFeedback({ type: 'error', message: 'Ingresá el nombre del responsable.' });
      return;
    }

    const data = await createInvitation(clientId);
    if (data) {
      showFeedback({ type: 'success', message: 'Código de invitación generado.' });
    }
  }, [name, clientId, createInvitation, showFeedback]);

  const handleCopy = useCallback(async () => {
    if (!result?.code) return;
    await Clipboard.setStringAsync(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result?.code]);

  const handleRegenerate = useCallback(async () => {
    await handleGenerate();
  }, [handleGenerate]);

  const relationshipLabel = relationshipIndex >= 0 ? RELATIONSHIP_OPTIONS[relationshipIndex] : '';
  const expiresAtLabel = result?.expires_at
    ? `Expira el ${formatClientDate(result.expires_at, clientTimezone)}`
    : 'Expira en 7 días';

  if (!permissions.can.invitations || !permissions.canAccessClient(clientId)) {
    return <UnauthorizedScreen />;
  }

  if (loading) {
    return (
      <ScreenWrapper title="Agregar responsable" onBackPress={onBack}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loadingColor.color} />
          <Text style={styles.loadingText}>Cargando cliente...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !client) {
    return (
      <ScreenWrapper title="Agregar responsable" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Cliente no encontrado'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Agregar responsable" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <FormSection title="Datos del responsable">
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej: María Gómez"
              placeholderTextColor={styles.placeholderColor.color}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Relación con el cliente</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setShowRelationshipOptions(!showRelationshipOptions)}
            >
              <Text style={[styles.selectText, !relationshipLabel && styles.selectPlaceholder]}>
                {relationshipLabel || 'Seleccioná una relación'}
              </Text>
              <AppIcon name="chevronDown" size={16} color={styles.chevronColor.color} />
            </Pressable>

            {showRelationshipOptions && (
              <View style={styles.optionsList}>
                {RELATIONSHIP_OPTIONS.map((option, index) => (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.optionItem,
                      relationshipIndex === index && styles.optionItemSelected,
                      pressed && styles.optionItemPressed,
                    ]}
                    onPress={() => {
                      setRelationshipIndex(index);
                      setShowRelationshipOptions(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        relationshipIndex === index && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </FormSection>

        <View style={styles.infoBox}>
          <AppIcon name="info" size={18} color={styles.infoIconColor.color} />
          <Text style={styles.infoText}>
            Se generará un <Text style={styles.infoBold}>código de invitación</Text> que el
            responsable debe usar al registrarse en Agendia. Una vez registrado, quedará vinculado
            automáticamente a <Text style={styles.infoBold}>{client.nombre}</Text>.
          </Text>
        </View>

        {result?.code && (
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>Código de invitación</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeValue}>{result.code}</Text>
              <Pressable
                style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
                onPress={copied ? undefined : handleCopy}
              >
                <AppIcon
                  name={copied ? 'check' : 'copy'}
                  size={14}
                  color={styles.copyButtonText.color}
                />
                <Text style={styles.copyButtonText}>{copied ? 'Copiado' : 'Copiar'}</Text>
              </Pressable>
            </View>
            <Text style={styles.codeHint}>
              Compartí este código con el responsable para que complete su registro.
            </Text>
            <View style={styles.codeExpiry}>
              <AppIcon name="clock" size={13} color={styles.expiryColor.color} />
              <Text style={styles.expiryText}>{expiresAtLabel}</Text>
            </View>
          </View>
        )}

        <FormActions
          primaryLabel={result?.code ? 'Regenerar código' : 'Generar invitación'}
          onPrimary={result?.code ? handleRegenerate : handleGenerate}
          secondaryLabel="Cancelar"
          onSecondary={onBack}
          primaryLoading={generating}
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
      paddingTop: 16,
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
    field: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    fieldLabel: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textSubtle,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
    },
    placeholderColor: {
      color: theme.colors.textSubtle,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    selectText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
    },
    selectPlaceholder: {
      color: theme.colors.textSubtle,
    },
    chevronColor: {
      color: theme.colors.textSubtle,
    },
    optionsList: {
      marginTop: 6,
      backgroundColor: theme.colors.surface,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      overflow: 'hidden',
    },
    optionItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    optionItemPressed: {
      backgroundColor: theme.colors.background,
    },
    optionText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
      fontWeight: theme.typography.weight.medium,
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weight.bold,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      marginHorizontal: 16,
      marginTop: 4,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.radii.medium,
      padding: 14,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    infoIconColor: {
      color: theme.colors.primary,
    },
    infoText: {
      flex: 1,
      fontSize: theme.typography.size.sm,
      color: theme.colors.primary,
      lineHeight: 18,
      fontWeight: theme.typography.weight.medium,
    },
    infoBold: {
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primaryDark,
    },
    codeBlock: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.medium,
      padding: 16,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    codeLabel: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    codeDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.small,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    codeValue: {
      fontSize: 22,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primary,
      letterSpacing: 4,
      fontFamily: 'monospace',
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.small,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    copyButtonPressed: {
      opacity: 0.85,
    },
    copyButtonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.semibold,
    },
    codeHint: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textSubtle,
      marginTop: 8,
      lineHeight: 16,
    },
    codeExpiry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    expiryColor: {
      color: theme.colors.disabled,
    },
    expiryText: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.disabled,
      fontWeight: theme.typography.weight.medium,
    },
  });
