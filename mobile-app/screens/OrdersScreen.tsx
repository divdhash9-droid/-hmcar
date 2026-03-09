// screens/OrdersScreen.tsx - شاشة طلباتي
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

interface Order {
    _id: string;
    orderNumber?: string;
    car?: {
        make?: string;
        model?: string;
        year?: number;
    };
    status?: string;
    totalPrice?: number;
    createdAt?: string;
    type?: string;
    notes?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', emoji: '⏳' },
    confirmed: { label: 'مؤكد', color: '#34d399', bg: 'rgba(52,211,153,0.1)', emoji: '✅' },
    processing: { label: 'قيد المعالجة', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', emoji: '⚙️' },
    completed: { label: 'مكتمل', color: '#34d399', bg: 'rgba(52,211,153,0.12)', emoji: '🎉' },
    cancelled: { label: 'ملغي', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', emoji: '❌' },
    rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', emoji: '🚫' },
    shipped: { label: 'في الشحن', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', emoji: '🚚' },
};

function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function OrderCard({ item }: { item: Order }) {
    const st = STATUS_MAP[item.status || ''] || { label: item.status || 'غير محدد', color: '#aaa', bg: 'rgba(255,255,255,0.05)', emoji: '📋' };
    const carName = item.car
        ? `${item.car.make || ''} ${item.car.model || ''} ${item.car.year || ''}`.trim()
        : 'سيارة';

    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardTop}>
                <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.color + '40' }]}>
                    <Text style={styles.statusEmoji}>{st.emoji}</Text>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
                <Text style={styles.orderNum}>
                    {item.orderNumber ? `#${item.orderNumber}` : '#' + item._id.slice(-6).toUpperCase()}
                </Text>
            </View>

            <Text style={styles.carName} numberOfLines={1}>🚗 {carName}</Text>

            <View style={styles.divider} />

            <View style={styles.cardBottom}>
                <View>
                    <Text style={styles.dateLabel}>تاريخ الطلب</Text>
                    <Text style={styles.dateValue}>{formatDate(item.createdAt)}</Text>
                </View>
                {item.totalPrice != null && (
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.priceLabel}>المبلغ</Text>
                        <Text style={styles.priceValue}>
                            {item.totalPrice.toLocaleString('ar-SA')} ر.س
                        </Text>
                    </View>
                )}
            </View>

            {item.notes && (
                <View style={styles.notesBox}>
                    <Text style={styles.notesText} numberOfLines={2}>📝 {item.notes}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

    useEffect(() => { loadOrders(); }, []);

    async function loadOrders() {
        try {
            const res = await api.orders.getMyOrders();
            const list = res.data?.orders || res.orders || res.data || [];
            setOrders(list);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const activeStatuses = ['pending', 'confirmed', 'processing', 'shipped'];
    const doneStatuses = ['completed', 'cancelled', 'rejected'];

    const filtered = filter === 'all'
        ? orders
        : filter === 'active'
            ? orders.filter(o => activeStatuses.includes(o.status || ''))
            : orders.filter(o => doneStatuses.includes(o.status || ''));

    const filters: { key: typeof filter; label: string }[] = [
        { key: 'all', label: 'الكل' },
        { key: 'active', label: '🔄 نشط' },
        { key: 'done', label: '✅ منتهي' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <LinearGradient colors={['#0d0d0d', '#000']} style={styles.header}>
                <Text style={styles.headerTitle}>📦 طلباتي</Text>
                <Text style={styles.headerCount}>{orders.length} طلب</Text>
            </LinearGradient>

            <View style={styles.filterRow}>
                {filters.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#c9a96e" size="large" />
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>📦</Text>
                    <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
                    <Text style={styles.emptySubtitle}>
                        {filter === 'active' ? 'لا توجد طلبات نشطة' : 'لا توجد طلبات منتهية'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <OrderCard item={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadOrders(); }}
                            tintColor="#c9a96e"
                        />
                    }
                />
            )}
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
    headerCount: { fontSize: 12, color: 'rgba(201,169,110,0.7)', fontWeight: '700' },

    filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    filterBtn: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 12, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    filterBtnActive: {
        backgroundColor: 'rgba(201,169,110,0.15)',
        borderColor: 'rgba(201,169,110,0.4)',
    },
    filterText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '700' },
    filterTextActive: { color: '#c9a96e' },

    listContent: { padding: 16, paddingBottom: 100 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        marginBottom: 14, padding: 16,
    },
    cardTop: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 10, borderWidth: 1,
    },
    statusEmoji: { fontSize: 11 },
    statusText: { fontSize: 11, fontWeight: '800' },
    orderNum: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: 1 },

    carName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'right' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    dateLabel: { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '600', marginBottom: 3 },
    dateValue: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
    priceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '600', marginBottom: 3 },
    priceValue: { fontSize: 14, color: '#c9a96e', fontWeight: '900' },

    notesBox: {
        marginTop: 12, backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10, padding: 10,
    },
    notesText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'right' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 13 },
    emptyEmoji: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginBottom: 6 },
    emptySubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.2)' },
});
