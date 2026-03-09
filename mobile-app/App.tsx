// App.tsx - نقطة الدخول الرئيسية للتطبيق - مع شريط التنقل الكامل
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CarsScreen from './screens/CarsScreen';
import AuctionsScreen from './screens/AuctionsScreen';
import OrdersScreen from './screens/OrdersScreen';
import AlertsScreen from './screens/AlertsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── أيقونات شريط التنقل ──
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: '🏠', inactive: '🏠' },
  Cars: { active: '🚗', inactive: '🚗' },
  Auctions: { active: '⚡', inactive: '⚡' },
  Orders: { active: '📦', inactive: '📦' },
  Alerts: { active: '🔔', inactive: '🔔' },
  Profile: { active: '👤', inactive: '👤' },
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'الرئيسية',
  Cars: 'السيارات',
  Auctions: 'المزادات',
  Orders: 'طلباتي',
  Alerts: 'التنبيهات',
  Profile: 'ملفي',
};

// ── شاشة التحميل ──
function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 72, height: 72, borderRadius: 18,
        backgroundColor: 'rgba(201,169,110,0.1)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#c9a96e', lineHeight: 24 }}>HM</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(201,169,110,0.5)', letterSpacing: 2 }}>CAR</Text>
      </View>
      <ActivityIndicator color="#c9a96e" size="small" />
    </View>
  );
}

// ── شريط التنقل السفلي المخصص ──
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tabStyles.barWrapper}>
      <BlurView intensity={80} tint="dark" style={tabStyles.blurBar}>
        <View style={tabStyles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const icon = TAB_ICONS[route.name];
            const label = TAB_LABELS[route.name] || route.name;

            return (
              <TouchableOpacity
                key={route.key}
                style={[tabStyles.tabItem, isFocused && tabStyles.tabItemActive]}
                onPress={() => {
                  if (!isFocused) navigation.navigate(route.name);
                }}
                activeOpacity={0.7}
              >
                {isFocused && <View style={tabStyles.activeIndicator} />}
                <Text style={[tabStyles.tabIcon, isFocused && tabStyles.tabIconActive]}>
                  {icon?.active || '●'}
                </Text>
                <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

// ── الشاشات الرئيسية (Tabs) ──
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Cars" component={CarsScreen} />
      <Tab.Screen name="Auctions" component={AuctionsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Navigator رئيسي ──
function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

// ── التطبيق الرئيسي ──
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#000" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

const tabStyles = StyleSheet.create({
  barWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  blurBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 8, paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    paddingVertical: 8, position: 'relative',
  },
  tabItemActive: {},
  activeIndicator: {
    position: 'absolute', top: 0,
    width: 24, height: 3, borderRadius: 2,
    backgroundColor: '#c9a96e',
  },
  tabIcon: { fontSize: 20, marginBottom: 3, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
  tabLabelActive: { color: '#c9a96e' },
});
