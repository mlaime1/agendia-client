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

type AuthMode = 'login' | 'register';

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Ocurrio un error inesperado');

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    return isRegisterMode && !name.trim();
  }, [email, isRegisterMode, isSubmitting, name, password]);

  const resetFormState = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegisterMode) {
        await register({ email, password, name });
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
            <Text style={styles.appName}>Agendia</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {isRegisterMode
                ? 'Completa tus datos para empezar a registrar viajes.'
                : 'Ingresa con tu email para continuar con tu calendario.'}
            </Text>
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
              label="Contrasena"
              onChangeText={setPassword}
              placeholder="Minimo 6 caracteres"
              returnKeyType="done"
              secureTextEntry
              textContentType={isRegisterMode ? 'newPassword' : 'password'}
              value={password}
            />

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
                <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
    gap: 26,
  },
  header: {
    gap: 8,
  },
  appName: {
    color: '#233329',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  title: {
    color: '#314139',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#637269',
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
    backgroundColor: '#247145',
    paddingHorizontal: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
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
    borderColor: '#CFE0D3',
    backgroundColor: '#FFFFFF',
  },
  switchButtonText: {
    color: '#247145',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  disabledButton: {
    backgroundColor: '#9DBAA7',
  },
  pressedButton: {
    opacity: 0.72,
  },
  error: {
    color: '#A33A34',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 18,
  },
});
