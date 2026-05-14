import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { CalendarScreen } from './src/features/calendar/screens/CalendarScreen';
import { ResumenesScreen } from './src/features/resumenes/screens/ResumenesScreen';
import { ResumenDetailScreen } from './src/features/resumenes/screens/ResumenDetailScreen';
import { CustomDrawer } from './src/components/CustomDrawer';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { clientsService } from './src/services/clients';
import type { Client } from './src/services/types';

type AppRoute = 'Calendario' | 'Historial' | 'Recorridos' | 'Resumenes' | 'Clientes' | 'Perfil';

type NavigationState = 
  | { screen: AppRoute }
  | { screen: 'ResumenDetail'; summaryId: string };

function AppContent() {
  const { isAuthenticated, isLoading, userProfile, logout } = useAuth();
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [navigation, setNavigation] = useState<NavigationState>({ screen: 'Calendario' });
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const loadClients = useCallback(async () => {
    try {
      const data = await clientsService.getAll();
      setClients(data);
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadClients();
    }
  }, [isAuthenticated, loadClients]);

  const handleNavigate = (routeName: string) => {
    setNavigation({ screen: routeName as AppRoute });
  };

  const handleOpenDetail = (summaryId: string) => {
    setNavigation({ screen: 'ResumenDetail', summaryId });
  };

  const handleBackFromDetail = () => {
    setNavigation({ screen: 'Resumenes' });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#247145" size="large" />
        <Text style={styles.loadingText}>Cargando sesion...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const drawerClients = clients.map((c) => ({ id: c.id, name: c.nombre }));
  const driverId = userProfile?.id || '';
  const activeRoute = navigation.screen === 'ResumenDetail' ? 'Resumenes' : navigation.screen;

  const renderCurrentScreen = () => {
    switch (navigation.screen) {
      case 'Resumenes':
        return (
          <ResumenesScreen
            selectedClientId={selectedClientId}
            driverId={driverId}
            onMenuPress={() => setDrawerVisible(true)}
            onOpenDetail={handleOpenDetail}
          />
        );
      case 'ResumenDetail':
        return (
          <ResumenDetailScreen
            summaryId={navigation.summaryId}
            onBack={handleBackFromDetail}
          />
        );
      case 'Calendario':
      default:
        return <CalendarScreen onMenuPress={() => setDrawerVisible(true)} />;
    }
  };

  return (
    <>
      {renderCurrentScreen()}

      <CustomDrawer
        visible={drawerVisible}
        user={{
          name: userProfile?.name || 'Usuario',
          email: userProfile?.email || '',
          role: userProfile?.role || 'driver',
        }}
        clients={drawerClients}
        selectedClientId={selectedClientId}
        activeRoute={activeRoute}
        onSelectClient={setSelectedClientId}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onClose={() => setDrawerVisible(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6FAF6',
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
