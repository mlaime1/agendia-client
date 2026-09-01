import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { CalendarScreen } from './src/features/calendar/screens/CalendarScreen';
import { HistorialScreen } from './src/features/historial/screens/HistorialScreen';
import { ClientesScreen } from './src/features/clientes/screens/ClientesScreen';
import { ClientsListScreen } from './src/features/clientes/screens/ClientsListScreen';
import { CreateClientScreen } from './src/features/clientes/screens/CreateClientScreen';
import { ClientDetailScreen } from './src/features/clientes/screens/ClientDetailScreen';
import { EditClientScreen } from './src/features/clientes/screens/EditClientScreen';
import { EditContractScreen } from './src/features/clientes/screens/EditContractScreen';
import { AddResponsibleScreen } from './src/features/clientes/screens/AddResponsibleScreen';
import { InviteClientScreen } from './src/features/clientes/screens/InviteClientScreen';
import { ResumenesScreen } from './src/features/resumenes/screens/ResumenesScreen';
import { ResumenDetailScreen } from './src/features/resumenes/screens/ResumenDetailScreen';
import { ProfileScreen } from './src/features/profile/screens/ProfileScreen';
import { EditProfileScreen } from './src/features/profile/screens/EditProfileScreen';
import { ChangePasswordScreen } from './src/features/profile/screens/ChangePasswordScreen';
import { RecorridosScreen } from './src/features/recorridos/screens/RecorridosScreen';
import { RecorridoDetailScreen } from './src/features/recorridos/screens/RecorridoDetailScreen';
import { CreateRecorridoScreen } from './src/features/recorridos/screens/CreateRecorridoScreen';
import { CustomDrawer } from './src/components/CustomDrawer';
import { UnauthorizedScreen } from './src/components/UnauthorizedScreen';
import { FeedbackProvider } from './src/state/FeedbackContext';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { usePermissions } from './src/permissions';
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
  | { screen: 'addResponsible'; clientId: string }
  | { screen: 'invite' };

type RecorridosNavigation =
  | { screen: 'list' }
  | { screen: 'detail'; recorridoId: string }
  | { screen: 'create' };

type ProfileNavigation =
  | { screen: 'view' }
  | { screen: 'edit' }
  | { screen: 'password' };

type NavigationState = 
  | { screen: AppRoute }
  | { screen: 'ResumenDetail'; summaryId: string }
  | { screen: 'RecorridoDetail'; recorridoId: string }
  | { screen: 'RecorridoCreate' };

function AppContent() {
  const { isAuthenticated, isLoading, isProfileLoading, session, userProfile, logout, connectionError, retryConnection } = useAuth();
  const { theme } = useTheme();
  const permissions = usePermissions(userProfile);
  const [recorridosNav, setRecorridosNav] = useState<RecorridosNavigation>({ screen: 'list' });
  const [profileNav, setProfileNav] = useState<ProfileNavigation>({ screen: 'view' });
  const styles = useThemedStyles(createStyles);
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [navigation, setNavigation] = useState<NavigationState>({ screen: 'Calendario' });
  const [clientsNav, setClientsNav] = useState<ClientsNavigation>({ screen: 'list' });
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const authIdentity = session?.user?.id ?? null;
  const authIdentityRef = useRef(authIdentity);
  authIdentityRef.current = authIdentity;

  useEffect(() => {
    setDrawerVisible(false);
    setNavigation({ screen: 'Calendario' });
    setClientsNav({ screen: 'list' });
    setRecorridosNav({ screen: 'list' });
    setProfileNav({ screen: 'view' });
    setClients([]);
    setSelectedClientId('');
  }, [authIdentity]);

  const loadClients = useCallback(async () => {
    const requestIdentity = authIdentity;

    try {
      const data = await clientsService.getAll();
      if (requestIdentity !== authIdentityRef.current) {
        return;
      }

      setClients(data);
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }, [authIdentity, selectedClientId]);

  const loadLinkedClient = useCallback(async (linkedClientId: string) => {
    const requestIdentity = authIdentity;

    try {
      const client = await clientsService.getById(linkedClientId);
      if (requestIdentity !== authIdentityRef.current) {
        return;
      }

      setClients([client]);
    } catch (err) {
      console.error('Error loading linked client:', err);
      setClients([]);
    }
  }, [authIdentity]);

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
    const routePermission = {
      Calendario: permissions.can.calendar && permissions.can.dashboard,
      Historial: permissions.can.calendar,
      Recorridos: permissions.can.trips,
      Resumenes: permissions.can.summaries,
      Clientes: permissions.can.clients,
      Perfil: permissions.isResolved,
    }[routeName as AppRoute];

    if (!routePermission) {
      return;
    }

    setNavigation({ screen: routeName as AppRoute });
    if (routeName === 'Clientes') {
      setClientsNav({ screen: 'list' });
    }
    if (routeName === 'Recorridos') {
      setRecorridosNav({ screen: 'list' });
    }
    if (routeName === 'Perfil') {
      setProfileNav({ screen: 'view' });
    }
  };

  const handleOpenRecorridoDetail = (recorridoId: string) => {
    if (!permissions.can.trips) return;
    setNavigation({ screen: 'RecorridoDetail', recorridoId });
  };

  const handleOpenCreateRecorrido = () => {
    if (!permissions.can.trips) return;
    setNavigation({ screen: 'RecorridoCreate' });
  };

  const handleBackFromCreateRecorrido = () => {
    setNavigation({ screen: 'Recorridos' });
  };

  const handleBackFromRecorridoDetail = () => {
    setNavigation({ screen: 'Recorridos' });
  };

  const handleOpenDetail = (summaryId: string) => {
    if (!permissions.can.summaries) return;
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

  if (!isAuthenticated && connectionError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>No se pudo conectar</Text>
        <Text style={styles.errorText}>{connectionError}</Text>
        <View style={styles.retryButton}>
          <Button title="Reintentar" onPress={() => void retryConnection()} color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (isProfileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Cargando sesion...</Text>
      </View>
    );
  }

  if (!permissions.isResolved || !permissions.can.dashboard) {
    return <UnauthorizedScreen onLogout={handleLogout} />;
  }

  const resolvedProfile = userProfile!;

  const drawerClients = clients.map((c) => ({ id: c.id, name: c.nombre }));
  const driverId = userProfile?.id || '';
  const activeRoute = 
    navigation.screen === 'ResumenDetail' ? 'Resumenes' 
    : navigation.screen === 'RecorridoDetail' ? 'Recorridos'
    : navigation.screen === 'RecorridoCreate' ? 'Recorridos'
    : navigation.screen;

  const selectedClientName = clients.find((c) => c.id === selectedClientId)?.nombre ?? '';

  const renderCurrentScreen = () => {
    const routeIsAuthorized = navigation.screen === 'RecorridoDetail' || navigation.screen === 'RecorridoCreate'
      ? permissions.can.trips
      : navigation.screen === 'ResumenDetail'
        ? permissions.can.summaries
        : navigation.screen === 'Calendario'
          ? permissions.can.calendar && permissions.can.dashboard
          : navigation.screen === 'Historial'
            ? permissions.can.calendar
            : navigation.screen === 'Recorridos'
              ? permissions.can.trips
              : navigation.screen === 'Resumenes'
                ? permissions.can.summaries
                : navigation.screen === 'Clientes'
                  ? permissions.can.clients
                  : permissions.isResolved;

    if (!routeIsAuthorized) {
      return <UnauthorizedScreen onLogout={handleLogout} />;
    }

    switch (navigation.screen) {
      case 'ResumenDetail':
        return (
          <ResumenDetailScreen
            summaryId={navigation.summaryId}
            role={userProfile?.role ?? 'unknown'}
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
                ? userProfile?.linked_client_id ?? ''
                : selectedClientId
            }
            driverId={driverId}
            role={userProfile?.role ?? 'unknown'}
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
                onEditClient={() => {
                  if (permissions.can.clientEditing) {
                    setClientsNav({ screen: 'edit', clientId: clientsNav.clientId });
                  }
                }}
                onEditContract={() => {
                  if (permissions.can.clientEditing) {
                    setClientsNav({ screen: 'editContract', clientId: clientsNav.clientId });
                  }
                }}
                onAddResponsible={() => {
                  if (permissions.can.clientEditing) {
                    setClientsNav({ screen: 'addResponsible', clientId: clientsNav.clientId });
                  }
                }}
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
          case 'invite':
            return <InviteClientScreen onBack={() => setClientsNav({ screen: 'list' })} />;
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
                onSelectClient={(clientId) => {
                  if (permissions.canAccessClient(clientId)) {
                    setClientsNav({ screen: 'detail', clientId });
                  }
                }}
                onNewClient={() => {
                  if (permissions.can.clientCreation) {
                    setClientsNav({ screen: 'create' });
                  }
                }}
                onInviteClient={() => {
                  if (permissions.can.invitations) {
                    setClientsNav({ screen: 'invite' });
                  }
                }}
              />
            );
        }
      case 'Perfil':
        switch (profileNav.screen) {
          case 'edit':
            return (
              <EditProfileScreen
                userProfile={resolvedProfile.role === 'unknown' ? { ...resolvedProfile, role: 'driver' } : resolvedProfile}
                onBack={() => setProfileNav({ screen: 'view' })}
              />
            );
          case 'password':
            return (
              <ChangePasswordScreen
                onBack={() => setProfileNav({ screen: 'view' })}
              />
            );
          case 'view':
          default:
            return (
              <ProfileScreen
                userProfile={resolvedProfile.role === 'unknown' ? { ...resolvedProfile, role: 'driver' } : resolvedProfile}
                onMenuPress={() => setDrawerVisible(true)}
                onEditProfile={() => setProfileNav({ screen: 'edit' })}
                onChangePassword={() => setProfileNav({ screen: 'password' })}
                onLogout={() => {
                  void handleLogout();
                }}
              />
            );
        }
      case 'Recorridos':
        return (
          <RecorridosScreen
            selectedClientId={selectedClientId}
            onMenuPress={() => setDrawerVisible(true)}
            onSelectRecorrido={handleOpenRecorridoDetail}
            onCreateRecorrido={handleOpenCreateRecorrido}
          />
        );
      case 'Historial':
        return (
          <HistorialScreen
            selectedClientId={
              userProfile?.role === 'client'
                ? userProfile?.linked_client_id ?? ''
                : selectedClientId
            }
            role={userProfile?.role ?? 'unknown'}
            onMenuPress={() => setDrawerVisible(true)}
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
                ? userProfile?.linked_client_id ?? ''
                : selectedClientId
            }
            onSelectClient={(clientId) => {
              if (permissions.canAccessClient(clientId)) {
                setSelectedClientId(clientId);
              }
            }}
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
        onSelectClient={(clientId) => {
          if (permissions.canAccessClient(clientId)) {
            setSelectedClientId(clientId);
          }
        }}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onClose={() => setDrawerVisible(false)}
        permissions={permissions}
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
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  errorTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    minWidth: 160,
  },
});
