// screens/LoginScreen.tsx - شاشة تسجيل الدخول الإبداعية
import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Animated,
    ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const { width, height } = Dimensions.get('window');

type Method = 'name' | 'phone';

export default function LoginScreen() {
    const { login } = useAuth();

    const [method, setMethod] = useState<Method>('name');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Animations
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async () => {
        setError('');
        if (!identifier.trim()) {
            setError(method === 'name' ? 'أدخل اسمك الكامل' : 'أدخل رقم الجوال');
            shake();
            return;
        }
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            shake();
            return;
        }

        if (method === 'name') {
            const parts = identifier.trim().split(/\s+/).filter(Boolean);
            if (parts.length < 2) {
                setError('أدخل الاسم الكامل (الاسم والأب على الأقل)');
                shake();
                return;
            }
        }

        setLoading(true);
        try {
            const response = await api.auth.autoLogin({
                name: identifier.trim(),
                password,
            });

            if (response.success) {
                await login(response.token, response.user);
            } else {
                setError(response.error || 'فشل تسجيل الدخول، تحقق من البيانات');
                shake();
            }
        } catch (err: any) {
            setError(err?.message || 'خطأ في الاتصال، تحقق من الإنترنت');
            shake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* خلفية متدرجة */}
            <LinearGradient
                colors={['#0a0005', '#000000', '#000812']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* دوائر الخلفية الديكورية */}
            <View style={styles.orbGold} />
            <View style={styles.orbBlue} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── الشعار ── */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoTextHM}>HM</Text>
                            <Text style={styles.logoTextCAR}>CAR</Text>
                        </View>
                        <Text style={styles.logoSubtitle}>PREMIUM AUTO MARKETPLACE</Text>
                    </View>

                    {/* ── العنوان ── */}
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>مرحباً بك</Text>
                        <Text style={styles.subtitle}>سجّل دخولك للوصول لحسابك</Text>
                    </View>

                    {/* ── بطاقة الدخول ── */}
                    <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

                        {/* خط ذهبي علوي */}
                        <LinearGradient
                            colors={['transparent', '#c9a96e', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cardTopLine}
                        />

                        {/* ── اختيار طريقة الدخول ── */}
                        <View style={styles.methodToggle}>
                            <TouchableOpacity
                                style={[styles.methodBtn, method === 'name' && styles.methodBtnActive]}
                                onPress={() => { setMethod('name'); setIdentifier(''); setError(''); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.methodBtnText, method === 'name' && styles.methodBtnTextActive]}>
                                    👤 بالاسم
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodBtn, method === 'phone' && styles.methodBtnActive]}
                                onPress={() => { setMethod('phone'); setIdentifier(''); setError(''); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.methodBtnText, method === 'phone' && styles.methodBtnTextActive]}>
                                    📱 برقم الجوال
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* ── حقل المعرّف ── */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                {method === 'name' ? 'الاسم الكامل' : 'رقم الجوال'}
                            </Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    placeholder={method === 'name' ? 'مثال: محمد أحمد العمري' : '+966 5XX XXX XXX'}
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    keyboardType={method === 'phone' ? 'phone-pad' : 'default'}
                                    autoCapitalize="words"
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        {/* ── حقل كلمة المرور ── */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>كلمة المرور</Text>
                            <View style={styles.inputWrapper}>
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                >
                                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.input, { paddingLeft: 44 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    secureTextEntry={!showPassword}
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        {/* ── رسالة الخطأ ── */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        ) : null}

                        {/* ── زر الدخول ── */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#d4b880', '#c9a96e', '#b8935a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" size="small" />
                                ) : (
                                    <Text style={styles.loginBtnText}>🚀 دخول</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* ── نص إضافي ── */}
                        <Text style={styles.footerNote}>
                            ليس لديك حساب؟ تواصل مع الإدارة
                        </Text>

                    </Animated.View>

                    {/* ── Branding ── */}
                    <Text style={styles.branding}>HM CAR SYSTEMS · v2.0</Text>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    keyboardView: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },

    // خلفية ديكورية
    orbGold: {
        position: 'absolute', width: 400, height: 400,
        borderRadius: 200, top: -150, right: -150,
        backgroundColor: 'rgba(201,169,110,0.08)',
    },
    orbBlue: {
        position: 'absolute', width: 300, height: 300,
        borderRadius: 150, bottom: -100, left: -100,
        backgroundColor: 'rgba(59,130,246,0.06)',
    },

    // الشعار
    logoSection: { alignItems: 'center', marginBottom: 32 },
    logoBox: {
        width: 72, height: 72, borderRadius: 18,
        backgroundColor: 'rgba(201,169,110,0.12)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    logoTextHM: { fontSize: 18, fontWeight: '900', color: '#c9a96e', lineHeight: 20 },
    logoTextCAR: { fontSize: 11, fontWeight: '700', color: 'rgba(201,169,110,0.6)', letterSpacing: 3 },
    logoSubtitle: { fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 4, fontWeight: '700' },

    // العنوان
    headerSection: { alignItems: 'center', marginBottom: 28 },
    title: { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 6 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

    // البطاقة
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 24, overflow: 'hidden',
    },
    cardTopLine: { height: 1, marginBottom: 24, marginHorizontal: -24 },

    // اختيار الطريقة
    methodToggle: {
        flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 14, padding: 4, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    methodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    methodBtnActive: { backgroundColor: '#c9a96e' },
    methodBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
    methodBtnTextActive: { color: '#000' },

    // حقول الإدخال
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '700', marginBottom: 8, textAlign: 'right', letterSpacing: 1 },
    inputWrapper: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(201,169,110,0.2)',
        flexDirection: 'row', alignItems: 'center',
    },
    input: {
        flex: 1, color: '#fff', fontSize: 15,
        paddingHorizontal: 16, paddingVertical: 14,
        fontWeight: '500',
    },
    eyeBtn: { padding: 14 },
    eyeIcon: { fontSize: 16 },

    // رسالة الخطأ
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        borderRadius: 12, padding: 12, marginBottom: 16,
    },
    errorText: { color: '#f87171', fontSize: 12, textAlign: 'center', fontWeight: '600' },

    // زر الدخول
    loginBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
    loginBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    loginBtnText: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 1 },

    // نص سفلي
    footerNote: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 16 },

    // برندنج
    branding: { textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: 9, letterSpacing: 3, marginTop: 32, fontWeight: '700' },
});
