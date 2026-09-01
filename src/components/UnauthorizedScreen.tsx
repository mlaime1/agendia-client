import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Theme, useThemedStyles } from "../theme";
import { useAuth } from "../state/AuthContext";

type UnauthorizedScreenProps = {
  onLogout?: () => void | Promise<void>;
};

export function UnauthorizedScreen({ onLogout }: UnauthorizedScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      void Promise.resolve((onLogout ?? logout)()).catch((error) => {
        console.error("Logout error:", error);
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso no autorizado</Text>
      <Text style={styles.message}>Tu cuenta no tiene permisos para acceder a esta sección.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <Text style={styles.logoutButtonText}>Volver al inicio de sesión</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 15,
    textAlign: "center",
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutButtonText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: "700",
  },
});
