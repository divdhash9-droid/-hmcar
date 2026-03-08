// App.tsx - نقطة الدخول الرئيسية للتطبيق
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 64, height: 64, borderRadius: 16,
        backgroundColor: 'rgba(201,169,110,0.1)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#c9a96e', lineHeight: 22 }}>HM</Text>
        <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(201,169,110,0.5)', letterSpacing: 2 }}>CAR</Text>
      </View>
      <ActivityIndicator color="#c9a96e" size="small" />
    </View>
  );
}

function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      {isLoggedIn ? (
        // ── شاشات العميل المسجّل ──
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </>
      ) : (
        // ── شاشات قبل تسجيل الدخول ──
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

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
