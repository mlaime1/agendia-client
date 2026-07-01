import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { CalendarScreen } from './src/features/calendar/screens/CalendarScreen';
import { ClientesScreen } from './src/features/clientes/screens/ClientesScreen';
import { ClientsListScreen } from './src/features/clientes/screens/ClientsListScreen';
import { CreateClientScreen } from './src/features/clientes/screens/CreateClientScreen';
import { ClientDetailScreen } from './src/features/clientes/screens/ClientDetailScreen';
import { EditClientScreen } from './src/features/clientes/screens/EditClientScreen';
import { EditContractScreen } from './src/features/clientes/screens/EditContractScreen';
import { AddResponsibleScreen } from './src/features/clientes/screens/AddResponsibleScreen';
import { ResumenesScreen } from './src/features/resumenes/screens/ResumenesScreen';
import { ResumenDetailScreen } from './src/features/resumenes/screens/ResumenDetailScreen';
import { ProfileScreen } from './src/features/profile/screens/ProfileScreen';
import { RecorridosScreen } from './src/features/recorridos/screens/RecorridosScreen';
import { RecorridoDetailScreen } from './src/features/recorridos/screens/RecorridoDetailScreen';
import { CreateRecorridoScreen } from './src/features/recorridos/screens/CreateRecorridoScreen';
import { CustomDrawer } from './src/components/CustomDrawer';
import { FeedbackProvider } from './src/state/FeedbackContext';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { clientsService } from './src/services/clients';
import type { Client } from './src/services/types';
import { ThemeProvider, useTheme, useThemedStyles } from './src/theme';

const SPLASH_MIN_DURATION_MS = 2200;

void SplashScreen.preventAutoHideAsync();

type AppRoute = 'Calendario' | 'Historial' | 'Recorridos' | 'Resumenes' | 'Clientes' | 'Perfil';

type ClientsNavigation =
  | { screen: 'list' }
  | { screen: 'create' }
  | { screen: 'detail'; clientId: string }
  | { screen: 'edit'; clientId: string }
  | { screen: 'editContract'; clientId: string }
  | { screen: 'addResponsible'; clientId: string };

type RecorridosNavigation =
  | { screen: 'list' }
  | { screen: 'detail'; recorridoId: string }
  | { screen: 'create' };

type NavigationState = 
  | { screen: AppRoute }
  | { screen: 'ResumenDetail'; summaryId: string }
  | { screen: 'RecorridoDetail'; recorridoId: string }
  | { screen: 'RecorridoCreate' };

function AppContent() {
  const { isAuthenticated, isLoading, userProfile, logout } = useAuth();
  const { theme } = useTheme();
  const [recorridosNav, setRecorridosNav] = useState<RecorridosNavigation>({ screen: 'list' });
  const styles = useThemedStyles(createStyles);
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [navigation, setNavigation] = useState<NavigationState>({ screen: 'Calendario' });
  const [clientsNav, setClientsNav] = useState<ClientsNavigation>({ screen: 'list' });
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

  const loadLinkedClient = useCallback(async (linkedClientId: string) => {
    try {
      const client = await clientsService.getById(linkedClientId);
      setClients([client]);
    } catch (err) {
      console.error('Error loading linked client:', err);
      setClients([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userProfile) {
      return;
    }

    if (userProfile.role === 'client') {
      if (userProfile.linked_client_id) {
        setSelectedClientId(userProfile.linked_client_id);
        void loadLinkedClient(userProfile.linked_client_id);
      }
      return;
    }

    void loadClients();
  }, [isAuthenticated, loadClients, loadLinkedClient, userProfile]);
  const handleNavigate = (routeName: string) => {
    setNavigation({ screen: routeName as AppRoute });
    if (routeName === 'Clientes') {
      setClientsNav({ screen: 'list' });
    }
    if (routeName === 'Recorridos') {
      setRecorridosNav({ screen: 'list' });
    }
  };

  const handleOpenRecorridoDetail = (recorridoId: string) => {
    setNavigation({ screen: 'RecorridoDetail', recorridoId });
  };

  const handleOpenCreateRecorrido = () => {
    setNavigation({ screen: 'RecorridoCreate' });
  };

  const handleBackFromCreateRecorrido = () => {
    setNavigation({ screen: 'Recorridos' });
  };

  const handleBackFromRecorridoDetail = () => {
    setNavigation({ screen: 'Recorridos' });
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
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Cargando sesion...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const drawerClients = clients.map((c) => ({ id: c.id, name: c.nombre }));
  const driverId = userProfile?.id || '';
  const activeRoute = 
    navigation.screen === 'ResumenDetail' ? 'Resumenes' 
    : navigation.screen === 'RecorridoDetail' ? 'Recorridos'
    : navigation.screen === 'RecorridoCreate' ? 'Recorridos'
    : navigation.screen;

  const selectedClientName = clients.find((c) => c.id === selectedClientId)?.nombre ?? '';

  const renderCurrentScreen = () => {
    switch (navigation.screen) {
      case 'ResumenDetail':
        return (
          <ResumenDetailScreen
            summaryId={navigation.summaryId}
            role={userProfile?.role ?? 'driver'}
            onBack={handleBackFromDetail}
          />
        );
      case 'RecorridoDetail':
        return (
          <RecorridoDetailScreen
            recorridoId={navigation.recorridoId}
            onBack={handleBackFromRecorridoDetail}
            onMenuPress={() => setDrawerVisible(true)}
          />
        );
      case 'RecorridoCreate':
        return (
          <CreateRecorridoScreen
            clientId={selectedClientId}
            onBack={handleBackFromCreateRecorrido}
            onMenuPress={() => setDrawerVisible(true)}
          />
        );
      case 'Resumenes':
        return (
          <ResumenesScreen
            selectedClientId={
              userProfile?.role === 'client'
                ? userProfile?.linked_client_id || selectedClientId
                : selectedClientId
            }
            driverId={driverId}
            role={userProfile?.role ?? 'driver'}
            onMenuPress={() => setDrawerVisible(true)}
            onOpenDetail={handleOpenDetail}
          />
        );
      case 'Clientes':
        switch (clientsNav.screen) {
          case 'detail':
            return (
              <ClientDetailScreen
                clientId={clientsNav.clientId}
                onBack={() => setClientsNav({ screen: 'list' })}
                onEditClient={() => setClientsNav({ screen: 'edit', clientId: clientsNav.clientId })}
                onEditContract={() => setClientsNav({ screen: 'editContract', clientId: clientsNav.clientId })}
                onAddResponsible={() => setClientsNav({ screen: 'addResponsible', clientId: clientsNav.clientId })}
              />
            );
          case 'edit':
            return (
              <EditClientScreen
                clientId={clientsNav.clientId}
                onBack={() => setClientsNav({ screen: 'detail', clientId: clientsNav.clientId })}
                onSave={() => setClientsNav({ screen: 'detail', clientId: clientsNav.clientId })}
              />
            );
          case 'editContract':
            return (
              <EditContractScreen
                clientId={clientsNav.clientId}
                onBack={() => setClientsNav({ screen: 'detail', clientId: clientsNav.clientId })}
                onSave={() => setClientsNav({ screen: 'detail', clientId: clientsNav.clientId })}
              />
            );
          case 'addResponsible':
            return (
              <AddResponsibleScreen
                clientId={clientsNav.clientId}
                onBack={() => setClientsNav({ screen: 'detail', clientId: clientsNav.clientId })}
              />
            );
          case 'create':
            return (
              <CreateClientScreen
                onBack={() => setClientsNav({ screen: 'list' })}
                onClientCreated={(clientId) => {
                  void loadClients();
                  setClientsNav({ screen: 'detail', clientId });
                }}
              />
            );
          case 'list':
          default:
            return (
              <ClientsListScreen
                onMenuPress={() => setDrawerVisible(true)}
                onSelectClient={(clientId) => setClientsNav({ screen: 'detail', clientId })}
                onNewClient={() => setClientsNav({ screen: 'create' })}
              />
            );
        }
      case 'Perfil':
        return (
          <ProfileScreen
            userProfile={userProfile || { id: '', name: '', email: '', alias: null, role: 'driver' }}
            onMenuPress={() => setDrawerVisible(true)}
          />
        );
      case 'Recorridos':
        return (
          <RecorridosScreen
            selectedClientId={selectedClientId}
            onMenuPress={() => setDrawerVisible(true)}
            onSelectRecorrido={handleOpenRecorridoDetail}
            onCreateRecorrido={handleOpenCreateRecorrido}
          />
        );
      case 'Calendario':
      default:
        return (
          <CalendarScreen
            onMenuPress={() => setDrawerVisible(true)}
            clients={drawerClients}
            selectedClientId={
              userProfile?.role === 'client'
                ? userProfile?.linked_client_id || selectedClientId
                : selectedClientId
            }
            onSelectClient={setSelectedClientId}
          />
        );
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
          linked_client_id: userProfile?.linked_client_id,
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
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, SPLASH_MIN_DURATION_MS));
      } finally {
        if (!isMounted) {
          return;
        }

        setIsSplashDone(true);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp().catch((err) => {
      console.warn('Splash hide error:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isSplashDone) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const createStyles = (theme: import('./src/theme').Theme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
