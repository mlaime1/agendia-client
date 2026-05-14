import React, { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenWrapperProps = {
  title: string;
  children: ReactNode;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
};

export function ScreenWrapper({
  title,
  children,
  onMenuPress,
  onBackPress,
  rightSlot,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top },
        ]}
      >
        <View style={styles.headerContent}>
          {/* Left slot - hamburger or back */}
          <View style={styles.leftSlot}>
            {onBackPress ? (
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                onPress={onBackPress}
                accessibilityLabel="Volver"
              >
                <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
              </Pressable>
            ) : onMenuPress ? (
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                onPress={onMenuPress}
                accessibilityLabel="Abrir menú"
              >
                <Ionicons name="menu" size={24} color="#1A1A1A" />
              </Pressable>
            ) : (
              <View style={styles.iconPlaceholder} />
            )}
          </View>

          {/* Center - title */}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {/* Right slot */}
          <View style={styles.rightSlot}>
            {rightSlot || <View style={styles.iconPlaceholder} />}
          </View>
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F0',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  leftSlot: {
    width: 48,
    alignItems: 'flex-start',
  },
  rightSlot: {
    width: 48,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconButtonPressed: {
    backgroundColor: '#F5F7F0',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
