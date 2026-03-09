// screens/ProfileScreen.tsx - شاشة الملف الشخصي
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, StatusBar,
    ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

interface ProfileField {
    key: string;
    label: string;
    icon: string;
    editable?: boolean;
    numeric?: boolean;
}

const FIELDS: ProfileField[] = [
    { key: 'name', label: 'الاسم الكامل', icon: '👤', editable: true },
    { key: 'phone', label: 'رقم الجوال', icon: '📱', editable: true, numeric: true },
    { key: 'email', label: 'البريد الإلكتروني', icon: '✉️', editable: true },
    { key: 'role', label: 'نوع الحساب', icon: '🏷️', editable: false },
];

const ROLE_MAP: Record<string, string> = {
    client: 'عميل',
    admin: 'مدير',
    superadmin: 'مدير عام',
};

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
    });
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!formData.name.trim()) {
            Alert.alert('تنبيه', 'الاسم مطلوب');
            return;
        }
        setSaving(true);
        try {
            await api.profile.update(formData);
            Alert.alert('تم', 'تم تحديث الملف الشخصي بنجاح ✅');
            setEditing(false);
        } catch {
            Alert.alert('خطأ', 'فشل تحديث البيانات، حاول لاحقاً');
        } finally {
            setSaving(false);
        }
    }

    function handleLogout() {
        Alert.alert('تسجيل الخروج', 'هل أنت متأكد أنك تريد الخروج؟', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'خروج', style: 'destructive',
                onPress: async () => { await logout(); },
            },
        ]);
    }

    const menuItems = [
        { icon: '🔔', label: 'الإشعارات', desc: 'إدارة تنبيهاتك', onPress: () => { } },
        { icon: '🔒', label: 'الأمان', desc: 'تغيير كلمة المرور', onPress: () => { } },
        { icon: '🌐', label: 'اللغة', desc: 'العربية', onPress: () => { } },
        { icon: '❓', label: 'الدعم الفني', desc: 'تواصل معنا', onPress: () => { } },
        { icon: '📋', label: 'الشروط والأحكام', onPress: () => { } },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <LinearGradient colors={['#0d0d0d', '#000']} style={styles.header}>
                        <Text style={styles.headerTitle}>👤 ملفي</Text>
                        <TouchableOpacity
                            style={styles.editToggle}
                            onPress={() => { setEditing(!editing); if (editing) setFormData({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' }); }}
                        >
                            <Text style={styles.editToggleText}>{editing ? '✕ إلغاء' : '✏️ تعديل'}</Text>
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* صورة الملف */}
                    <View style={styles.avatarSection}>
                        <LinearGradient
                            colors={['rgba(201,169,110,0.2)', 'rgba(201,169,110,0.05)']}
                            style={styles.avatarCircle}
                        >
                            <Text style={styles.avatarLetter}>
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                        <Text style={styles.avatarName}>{user?.name || 'مستخدم'}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>
                                {ROLE_MAP[user?.role || ''] || user?.role || 'عميل'}
                            </Text>
                        </View>
                    </View>

                    {/* بيانات الملف */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>البيانات الشخصية</Text>
                        <View style={styles.fieldsCard}>
                            {FIELDS.map((field, i) => {
                                const value = field.key === 'role'
                                    ? ROLE_MAP[user?.role || ''] || user?.role || ''
                                    : formData[field.key as keyof typeof formData] || user?.[field.key as keyof typeof user] || '';

                                return (
                                    <View
                                        key={field.key}
                                        style={[styles.fieldRow, i < FIELDS.length - 1 && styles.fieldBorder]}
                                    >
                                        <View style={styles.fieldLeft}>
                                            <Text style={styles.fieldIcon}>{field.icon}</Text>
                                            <Text style={styles.fieldLabel}>{field.label}</Text>
                                        </View>
                                        {editing && field.editable ? (
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={formData[field.key as keyof typeof formData] as string}
                                                onChangeText={v => setFormData(prev => ({ ...prev, [field.key]: v }))}
                                                keyboardType={field.numeric ? 'phone-pad' : 'default'}
                                                textAlign="right"
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                placeholder={field.label}
                                            />
                                        ) : (
                                            <Text style={styles.fieldValue} numberOfLines={1}>
                                                {value as string || '—'}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                        {editing && (
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <LinearGradient
                                    colors={['#d4b880', '#c9a96e', '#b8935a']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.saveBtnGradient}
                                >
                                    {saving
                                        ? <ActivityIndicator color="#000" size="small" />
                                        : <Text style={styles.saveBtnText}>💾 حفظ التغييرات</Text>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* القائمة */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>الإعدادات</Text>
                        <View style={styles.menuCard}>
                            {menuItems.map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.menuRow, i < menuItems.length - 1 && styles.menuBorder]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.menuArrow}>›</Text>
                                    <View style={styles.menuRight}>
                                        {item.desc && (
                                            <Text style={styles.menuDesc}>{item.desc}</Text>
                                        )}
                                        <Text style={styles.menuLabel}>{item.label}</Text>
                                    </View>
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* زر الخروج */}
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Text style={styles.logoutText}>🚪 تسجيل الخروج</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Branding */}
                    <Text style={styles.version}>HM CAR · الإصدار 2.0</Text>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080808' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
    editToggle: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    editToggleText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },

    avatarSection: { alignItems: 'center', paddingVertical: 32 },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, borderWidth: 1.5,
        borderColor: 'rgba(201,169,110,0.3)',
    },
    avatarLetter: { fontSize: 36, fontWeight: '900', color: '#c9a96e' },
    avatarName: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8 },
    roleBadge: {
        backgroundColor: 'rgba(201,169,110,0.12)',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5,
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)',
    },
    roleBadgeText: { fontSize: 12, color: '#c9a96e', fontWeight: '800' },

    section: { paddingHorizontal: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 12, textAlign: 'right' },

    fieldsCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    fieldRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        justifyContent: 'space-between',
    },
    fieldBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fieldIcon: { fontSize: 16 },
    fieldLabel: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
    fieldValue: { fontSize: 13, color: '#fff', fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
    fieldInput: {
        fontSize: 13, color: '#fff', fontWeight: '600',
        maxWidth: '55%', paddingVertical: 4,
        borderBottomWidth: 1, borderBottomColor: 'rgba(201,169,110,0.4)',
    },

    saveBtn: { marginTop: 14, borderRadius: 14, overflow: 'hidden' },
    saveBtnGradient: { paddingVertical: 15, alignItems: 'center' },
    saveBtnText: { fontSize: 14, fontWeight: '900', color: '#000' },

    menuCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    menuIcon: { fontSize: 18, marginRight: 12 },
    menuRight: { flex: 1 },
    menuLabel: { fontSize: 14, color: '#fff', fontWeight: '700', textAlign: 'right' },
    menuDesc: { fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginBottom: 2 },
    menuArrow: { fontSize: 20, color: 'rgba(255,255,255,0.15)', fontWeight: '300' },

    logoutBtn: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderRadius: 16, borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
        paddingVertical: 16, alignItems: 'center',
    },
    logoutText: { fontSize: 15, color: '#ef4444', fontWeight: '800' },

    version: {
        textAlign: 'center', color: 'rgba(255,255,255,0.1)',
        fontSize: 10, letterSpacing: 2, marginBottom: 16, fontWeight: '700',
    },
});
