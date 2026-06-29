import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { MOCK_CLIENTS } from '../mockData';

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

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'AG-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function AddResponsibleScreen({ clientId, onBack }: AddResponsibleScreenProps) {
  const styles = useThemedStyles(createStyles);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId);

  const [name, setName] = useState('');
  const [relationshipIndex, setRelationshipIndex] = useState(-1);
  const [showRelationshipOptions, setShowRelationshipOptions] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const clientName = client?.nombre || 'el cliente';

  const handleGenerate = () => {
    if (!name.trim()) return;
    const code = generateCode();
    setGeneratedCode(code);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const code = generateCode();
    setGeneratedCode(code);
    setCopied(false);
  };

  const relationshipLabel = relationshipIndex >= 0 ? RELATIONSHIP_OPTIONS[relationshipIndex] : '';

  if (!client) {
    return (
      <ScreenWrapper title="Agregar responsable" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Cliente no encontrado</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Agregar responsable" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del responsable</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <TextInput
              style={[styles.input, !name.trim() && generatedCode === null ? null : null]}
              value={name}
              onChangeText={setName}
              placeholder="Ej: María Gómez"
              placeholderTextColor={styles.placeholderColor.color}
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
                    <Text style={[styles.optionText, relationshipIndex === index && styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoBox}>
          <AppIcon name="info" size={18} color={styles.infoIconColor.color} />
          <Text style={styles.infoText}>
            Se generará un <Text style={styles.infoBold}>código de invitación</Text> que el
            responsable debe usar al registrarse en Agendia. Una vez registrado, quedará vinculado
            automáticamente a <Text style={styles.infoBold}>{clientName}</Text>.
          </Text>
        </View>

        {generatedCode && (
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>Código de invitación</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeValue}>{generatedCode}</Text>
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
              <Text style={styles.expiryText}>Expira en 7 días · 15/06/2026</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={generatedCode ? handleRegenerate : handleGenerate}
          >
            <AppIcon
              name={generatedCode ? 'refresh' : 'send'}
              size={18}
              color={styles.primaryButtonText.color}
            />
            <Text style={styles.primaryButtonText}>
              {generatedCode ? 'Regenerar código' : 'Generar invitación'}
            </Text>
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
      paddingTop: 16,
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
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    selectText: {
      fontSize: 14,
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
      borderRadius: 10,
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
      fontSize: 14,
      color: theme.colors.text,
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    infoBox: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 14,
      padding: 14,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    infoIconColor: {
      color: theme.colors.primary,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.primary,
      lineHeight: 18,
      fontWeight: '500',
    },
    infoBold: {
      fontWeight: '700',
      color: theme.colors.primaryDark,
    },
    codeBlock: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    codeLabel: {
      fontSize: 11,
      fontWeight: '700',
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
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    codeValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 4,
      fontFamily: 'monospace',
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    copyButtonPressed: {
      opacity: 0.85,
    },
    copyButtonText: {
      color: theme.colors.primaryLight,
      fontSize: 12,
      fontWeight: '600',
    },
    codeHint: {
      fontSize: 11,
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
      fontSize: 11,
      color: theme.colors.disabled,
      fontWeight: '500',
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
