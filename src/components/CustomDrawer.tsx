import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.82;

type User = {
  name: string;
  email: string;
  role: string;
  avatar?: string;
};

type Client = {
  id: string;
  name: string;
};

type MenuItemConfig = {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const menuItems: MenuItemConfig[] = [
  { route: 'Calendario', label: 'Calendario', icon: 'calendar-outline' },
  { route: 'Historial', label: 'Historial', icon: 'time-outline' },
  { route: 'Recorridos', label: 'Recorridos', icon: 'map-outline' },
  { route: 'Resumenes', label: 'Resúmenes', icon: 'document-text-outline' },
  { route: 'Clientes', label: 'Clientes', icon: 'people-outline' },
  { route: 'Perfil', label: 'Perfil', icon: 'person-outline' },
];

type CustomDrawerProps = {
  visible: boolean;
  user: User;
  clients: Client[];
  selectedClientId: string;
  activeRoute: string;
  onSelectClient: (id: string) => void;
  onNavigate: (routeName: string) => void;
  onLogout: () => void;
  onClose: () => void;
};

export function CustomDrawer({
  visible,
  user,
  clients,
  selectedClientId,
  activeRoute,
  onSelectClient,
  onNavigate,
  onClose,
  onLogout,
}: CustomDrawerProps) {
  const insets = useSafeAreaInsets();
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      driver: 'Conductor',
      client: 'Cliente',
    };
    return roleMap[role] || role;
  };

  const handleMenuPress = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const handleClientSelect = (clientId: string) => {
    onSelectClient(clientId);
    setClientModalVisible(false);
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  useEffect(() => {
    if (visible) {
      translateX.setValue(0);
    }
  }, [translateX, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isHorizontalGesture = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          return isHorizontalGesture && Math.abs(gestureState.dx) > 8;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextTranslate = Math.max(Math.min(gestureState.dx, 0), -DRAWER_WIDTH);
          translateX.setValue(nextTranslate);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose = gestureState.dx < -(DRAWER_WIDTH * 0.25) || gestureState.vx < -0.6;
          if (shouldClose) {
            Animated.timing(translateX, {
              toValue: -DRAWER_WIDTH,
              duration: 140,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) {
                onClose();
              }
            });
            return;
          }

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [onClose, translateX],
  );

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View
          style={[styles.drawer, { paddingTop: insets.top, transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          {/* Header - Blue section */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{getRoleLabel(user.role)}</Text>
            </View>

            {/* Client selector */}
            <Pressable
              style={({ pressed }) => [
                styles.clientSelector,
                pressed && styles.clientSelectorPressed,
              ]}
              onPress={() => setClientModalVisible(true)}
            >
              <Text style={styles.clientSelectorText} numberOfLines={1}>
                {selectedClient?.name || 'Seleccionar cliente'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.primaryLight} />
            </Pressable>
          </View>

          {/* Menu items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => {
              const isActive = activeRoute === item.route;
              return (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? theme.colors.primary : theme.colors.mutedText}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isActive ? <View style={styles.activeDot} /> : null}
                </Pressable>
              );
            })}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Client selection modal */}
      <Modal
        animationType="slide"
        transparent
        visible={clientModalVisible}
        onRequestClose={() => setClientModalVisible(false)}
      >
        <View style={styles.clientModalOverlay}>
          <Pressable
            style={styles.clientModalBackdrop}
            onPress={() => setClientModalVisible(false)}
          />
          <View style={[styles.clientModalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.clientModalHeader}>
              <Text style={styles.clientModalTitle}>Seleccionar cliente</Text>
              <Pressable
                onPress={() => setClientModalVisible(false)}
                style={styles.clientModalClose}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedClientId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.clientItem,
                      isSelected && styles.clientItemSelected,
                      pressed && styles.clientItemPressed,
                    ]}
                    onPress={() => handleClientSelect(item.id)}
                  >
                    <Text
                      style={[
                        styles.clientItemText,
                        isSelected && styles.clientItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#3A6B2A" />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay clientes disponibles</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
  },
  drawer: {
    width: DRAWER_WIDTH,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 24,
    paddingBottom: theme.spacing.md,
  },
  userInfo: {
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    color: theme.colors.primaryLight,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    color: 'rgba(232,245,233,0.75)',
    fontSize: 13,
    marginBottom: 2,
  },
  userRole: {
    color: 'rgba(232,245,233,0.6)',
    fontSize: 13,
  },
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.whiteTransparent18,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.whiteTransparent12,
  },
  clientSelectorPressed: {
    opacity: 0.9,
  },
  clientSelectorText: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radii.medium,
    marginVertical: 6,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemText: {
    color: theme.colors.mutedText,
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E8EDE0',
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  logoutButton: {
    paddingVertical: 8,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginLeft: 'auto',
  },
  // Client modal styles
  clientModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  clientModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  clientModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  clientModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE0',
  },
  clientModalTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
  clientModalClose: {
    padding: 4,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7F0',
  },
  clientItemSelected: {
    backgroundColor: '#EAF3DE',
  },
  clientItemPressed: {
    backgroundColor: '#F5F7F0',
  },
  clientItemText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  clientItemTextSelected: {
    color: '#3A6B2A',
    fontWeight: '700',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
