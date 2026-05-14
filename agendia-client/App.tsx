import React from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { CalendarScreen } from './src/features/calendar/screens/CalendarScreen';
import { AuthProvider, useAuth } from './src/state/AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContent}>
          <ActivityIndicator color="#247145" size="large" />
          <Text style={styles.loadingText}>Cargando sesion...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return isAuthenticated ? <CalendarScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#3D4C42',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
