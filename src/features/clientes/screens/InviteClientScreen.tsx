import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../../../components/AppIcon';
import { FormActions } from '../../../components/FormActions';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useFeedback } from '../../../state/FeedbackContext';
import { useCreateInvitation } from '../hooks';
import { formatClientDate, getClientTimezone } from '../../../utils/dateTime';
import { UnauthorizedScreen } from '../../../components/UnauthorizedScreen';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type InviteClientScreenProps = {
  onBack: () => void;
};

export function InviteClientScreen({ onBack }: InviteClientScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const { result, loading, error, createInvitation } = useCreateInvitation();

  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    const data = await createInvitation(null);
    if (data) {
      showFeedback({ type: 'success', message: 'Código de invitación generado.' });
    }
  }, [createInvitation, showFeedback]);

  const handleCopy = useCallback(async () => {
    if (!result?.code) return;
    await Clipboard.setStringAsync(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result?.code]);

  const expiresAtLabel = result?.expires_at
    ? `Expira el ${formatClientDate(result.expires_at, getClientTimezone())}`
    : 'Expira en 24 horas';

  if (!permissions.can.invitations) {
    return <UnauthorizedScreen />;
  }

  return (
    <ScreenWrapper title="Invitar cliente" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <AppIcon name="info" size={18} color={styles.infoIconColor.color} />
          <Text style={styles.infoText}>
            Se generará un <Text style={styles.infoBold}>código de invitación</Text> para un
            cliente nuevo. Cuando la persona se registre en Agendia con este código, se creará
            su cliente automáticamente y quedará vinculado a tu cuenta. El teléfono se solicita
            durante el registro.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {result?.code ? (
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
              Compartí este código con el cliente para que complete su registro.
            </Text>
            <View style={styles.codeExpiry}>
              <AppIcon name="clock" size={13} color={styles.expiryColor.color} />
              <Text style={styles.expiryText}>{expiresAtLabel}</Text>
            </View>
          </View>
        ) : null}

        <FormActions
          primaryLabel={result?.code ? 'Generar nuevo código' : 'Generar invitación'}
          onPrimary={handleGenerate}
          secondaryLabel="Cancelar"
          onSecondary={onBack}
          primaryLoading={loading}
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
    infoBox: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      marginHorizontal: 16,
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
    errorText: {
      marginHorizontal: 16,
      marginTop: 10,
      fontSize: theme.typography.size.sm,
      color: theme.colors.danger,
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
