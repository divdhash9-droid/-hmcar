// screens/DashboardScreen.tsx - لوحة التحكم الرئيسية
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

interface DashboardStats {
    totalOrders: number;
    activeBids: number;
    savedCars: number;
    activeAlerts: number;
}

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { loadDashboard(); }, []);

    async function loadDashboard() {
        try {
            const response = await api.dashboard.getClientData();
            if (response.success) setStats(response.data);
        } catch {
            // نعرض أصفار إذا فشل التحميل
            setStats({ totalOrders: 0, activeBids: 0, savedCars: 0, activeAlerts: 0 });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const statCards = [
        { label: 'طلباتي', value: stats?.totalOrders ?? 0, emoji: '📦', color: '#c9a96e' },
        { label: 'مزايداتي', value: stats?.activeBids ?? 0, emoji: '🔨', color: '#60a5fa' },
        { label: 'محفوظاتي', value: stats?.savedCars ?? 0, emoji: '❤️', color: '#f472b6' },
        { label: 'تنبيهاتي', value: stats?.activeAlerts ?? 0, emoji: '🔔', color: '#34d399' },
    ];

    const quickActions = [
        { label: 'تصفح السيارات', emoji: '🚗', screen: 'Cars' },
        { label: 'المزادات', emoji: '⚡', screen: 'Auctions' },
        { label: 'طلباتي', emoji: '📋', screen: 'Orders' },
        { label: 'التنبيهات', emoji: '🔔', screen: 'Alerts' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <LinearGradient colors={['#0d0d0d', '#000']} style={styles.header}>
                <View>
                    <Text style={styles.greeting}>مرحباً 👋</Text>
                    <Text style={styles.userName}>{user?.name || 'العميل'}</Text>
                </View>
                <View style={styles.logoSmall}>
                    <Text style={styles.logoSmallHM}>HM</Text>
                    <Text style={styles.logoSmallCAR}>CAR</Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadDashboard(); }}
                        tintColor="#c9a96e"
                    />
                }
            >
                {/* بطاقات الإحصائيات */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>نظرة عامة</Text>
                    {loading ? (
                        <ActivityIndicator color="#c9a96e" size="large" style={{ marginTop: 20 }} />
                    ) : (
                        <View style={styles.statsGrid}>
                            {statCards.map((card, i) => (
                                <View key={i} style={styles.statCard}>
                                    <Text style={styles.statEmoji}>{card.emoji}</Text>
                                    <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                                    <Text style={styles.statLabel}>{card.label}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* الإجراءات السريعة */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>وصول سريع</Text>
                    <View style={styles.actionsGrid}>
                        {quickActions.map((action, i) => (
                            <TouchableOpacity key={i} style={styles.actionCard} activeOpacity={0.75}>
                                <View style={styles.actionIcon}>
                                    <Text style={styles.actionEmoji}>{action.emoji}</Text>
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* معلومات الحساب */}
                <View style={styles.section}>
                    <View style={styles.accountCard}>
                        <View style={styles.accountRow}>
                            <Text style={styles.accountLabel}>الحساب</Text>
                            <Text style={styles.accountValue}>{user?.name}</Text>
                        </View>
                        {user?.email && (
                            <View style={styles.accountRow}>
                                <Text style={styles.accountLabel}>البريد</Text>
                                <Text style={styles.accountValue}>{user.email}</Text>
                            </View>
                        )}
                        <View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.accountLabel}>النوع</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>عميل مميز</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080808' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    greeting: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '600', marginBottom: 2 },
    userName: { fontSize: 22, fontWeight: '900', color: '#fff' },
    logoSmall: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(201,169,110,0.1)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    logoSmallHM: { fontSize: 12, fontWeight: '900', color: '#c9a96e', lineHeight: 14 },
    logoSmallCAR: { fontSize: 7, fontWeight: '700', color: 'rgba(201,169,110,0.5)', letterSpacing: 2 },

    scroll: { flex: 1 },
    section: { paddingHorizontal: 16, marginTop: 24 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 14, textAlign: 'right' },

    // بطاقات الإحصائيات
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: {
        flex: 1, minWidth: '44%', backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        padding: 16, alignItems: 'center',
    },
    statEmoji: { fontSize: 24, marginBottom: 8 },
    statValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },

    // الإجراءات السريعة
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionCard: {
        flex: 1, minWidth: '44%', backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        padding: 16, alignItems: 'center',
    },
    actionIcon: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: 'rgba(201,169,110,0.08)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    actionEmoji: { fontSize: 22 },
    actionLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

    // معلومات الحساب
    accountCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    accountRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    accountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
    accountValue: { fontSize: 13, color: '#fff', fontWeight: '700' },
    roleBadge: {
        backgroundColor: 'rgba(201,169,110,0.15)', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)',
    },
    roleBadgeText: { fontSize: 11, color: '#c9a96e', fontWeight: '800' },
});
