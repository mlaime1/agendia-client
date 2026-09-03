import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../../state/AuthContext';
import { AuthTextField } from '../components/AuthTextField';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import { AppIcon } from '../../../components/AppIcon';
import { api } from '../../../services/backendApi';
import Logo from '../../../../assets/icon/logo.svg';

type AuthMode = 'login' | 'register';
type InvitationStatus = 'idle' | 'loading' | 'valid' | 'invalid';

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Ocurrio un error inesperado');

export function AuthScreen() {
  const { login, register, registerWithCode } = useAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>('idle');
  const [needsPhone, setNeedsPhone] = useState(false);

  const isRegisterMode = mode === 'register';
  const title = isRegisterMode ? 'Crear cuenta' : 'Iniciar sesion';
  const submitLabel = isRegisterMode ? 'Registrarme' : 'Entrar';
  const switchLabel = isRegisterMode ? 'Ya tengo cuenta' : 'Crear cuenta';

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }

    if (!email.trim() || password.length < 6) {
      return true;
    }

    if (isRegisterMode) {
      if (!name.trim()) return true;
      if (invitationStatus !== 'valid') return true;
      if (needsPhone && !phone.trim()) return true;
    }

    return false;
  }, [email, isRegisterMode, isSubmitting, name, password, invitationStatus, needsPhone, phone]);

  const resetFormState = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setInvitationCode('');
    setPhone('');
    setInvitationStatus('idle');
    setNeedsPhone(false);
  };

  const validateInvitationCode = async (code: string) => {
    if (!code.trim()) {
      setInvitationStatus('idle');
      setNeedsPhone(false);
      return;
    }

    setInvitationStatus('loading');

    try {
      const response = await api.get<{ valid: boolean; client_id: string | null }>(`/invitations/${code.trim()}`);

      if (response.valid) {
        setInvitationStatus('valid');
        setNeedsPhone(response.client_id === null);
      } else {
        setInvitationStatus('invalid');
        setNeedsPhone(false);
      }
    } catch {
      setInvitationStatus('invalid');
      setNeedsPhone(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegisterMode) {
        await registerWithCode({
          email,
          password,
          name,
          invitation_code: invitationCode.trim(),
          phone: needsPhone ? phone : undefined,
        });
      } else {
        await login(email, password);
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo color={theme.colors.primary} height={150} width={150} />
            <Text style={styles.appName}>Agendia</Text>
            {isRegisterMode ? (
              <>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>Completa tus datos para empezar a registrar viajes.</Text>
              </>
            ) : null}
          </View>

          <View style={styles.form}>
            {isRegisterMode ? (
              <AuthTextField
                autoComplete="name"
                label="Nombre"
                onChangeText={setName}
                placeholder="Tu nombre"
                returnKeyType="next"
                value={name}
              />
            ) : null}

            <AuthTextField
              autoComplete="email"
              inputMode="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="nombre@email.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />

            <AuthTextField
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              label="Contraseña"
              onChangeText={setPassword}
              placeholder="Minimo 6 caracteres"
              returnKeyType="done"
              secureTextEntry
              textContentType={isRegisterMode ? 'newPassword' : 'password'}
              value={password}
            />

            {isRegisterMode ? (
              <View>
                <View style={styles.field}>
                  <Text style={styles.label}>Codigo de invitacion</Text>
                  <View style={styles.inputRow}>
                    <AuthTextField
                      autoComplete="off"
                      label=""
                      onChangeText={(text) => {
                        setInvitationCode(text);
                        if (invitationStatus !== 'idle') {
                          setInvitationStatus('idle');
                          setNeedsPhone(false);
                        }
                      }}
                      onBlur={() => validateInvitationCode(invitationCode)}
                      placeholder="Ingresa tu codigo de invitacion"
                      returnKeyType="next"
                      value={invitationCode}
                      style={styles.invitationInput}
                    />
                    <View style={styles.validationIcon}>
                      {invitationStatus === 'loading' && (
                        <ActivityIndicator size="small" color={theme.colors.textMuted} />
                      )}
                      {invitationStatus === 'valid' && (
                        <AppIcon name="checkCircle" size={20} color={theme.colors.semantic.success.text} />
                      )}
                      {invitationStatus === 'invalid' && (
                        <AppIcon name="closeCircle" size={20} color={theme.colors.danger} />
                      )}
                    </View>
                  </View>
                </View>
                {needsPhone ? (
                  <AuthTextField
                    autoComplete="tel"
                    inputMode="tel"
                    keyboardType="phone-pad"
                    label="Telefono"
                    onChangeText={setPhone}
                    placeholder="Tu numero de telefono"
                    returnKeyType="done"
                    value={phone}
                  />
                ) : null}
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitDisabled}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || isSubmitting) && styles.pressedButton,
                isSubmitDisabled && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.submitButtonText}>{submitLabel}</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => resetFormState(isRegisterMode ? 'login' : 'register')}
              style={({ pressed }) => [styles.switchButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.switchButtonText}>{switchLabel}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 24,
    gap: 26,
  },
  header: {
    gap: 4,
    alignItems: 'center',
  },
  appName: {
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  title: {
    color: theme.colors.textMuted,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
  },
  form: {
    gap: 14,
  },
  submitButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
  },
  submitButtonText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  switchButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  switchButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
  },
  pressedButton: {
    opacity: 0.72,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 18,
  },
  field: {
    gap: 7,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  invitationInput: {
    flex: 1,
    paddingRight: 40,
  },
  validationIcon: {
    position: 'absolute',
    right: 10,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
