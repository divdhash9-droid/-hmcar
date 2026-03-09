// screens/AuctionsScreen.tsx - شاشة المزادات
import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

interface Auction {
    _id: string;
    title?: string;
    car?: {
        make?: string;
        model?: string;
        year?: number;
        images?: string[];
    };
    startPrice?: number;
    startingPrice?: number;
    currentBid?: number;
    currentPrice?: number;
    endTime?: string;
    endsAt?: string;
    status?: string;
    bidCount?: number;
    bidsCount?: number;
}

function useCountdown(endTime: string | undefined) {
    const [remaining, setRemaining] = useState('');
    useEffect(() => {
        if (!endTime) return;
        const tick = () => {
            const diff = new Date(endTime).getTime() - Date.now();
            if (diff <= 0) { setRemaining('انتهى'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [endTime]);
    return remaining;
}

function AuctionCard({ item }: { item: Auction }) {
    const countdown = useCountdown(item.endsAt || item.endTime);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        if (item.status === 'active' || item.status === 'running') loop.start();
        return () => loop.stop();
    }, [item.status]);

    const carName = item.car
        ? `${item.car.make || ''} ${item.car.model || ''} ${item.car.year || ''}`
        : item.title || 'مزاد';

    const isActive = item.status === 'active' || item.status === 'running';
    const isEnded = item.status === 'ended' || item.status === 'closed' || countdown === 'انتهى';
    const currentPrice = item.currentPrice || item.currentBid || item.startingPrice || item.startPrice || 0;
    const bids = item.bidsCount || item.bidCount || 0;

    return (
        <TouchableOpacity activeOpacity={0.85} style={styles.card}>
            {/* شريط الحالة العلوي */}
            <LinearGradient
                colors={isActive ? ['#c9a96e22', '#00000000'] : ['#33333322', '#00000000']}
                style={styles.cardGradient}
            />
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.endedBadge]}>
                    <Animated.View style={isActive ? { transform: [{ scale: pulseAnim }] } : {}}>
                        <Text style={styles.statusDot}>{isActive ? '🔴' : '⚫'}</Text>
                    </Animated.View>
                    <Text style={[styles.statusText, isActive ? styles.activeText : styles.endedText]}>
                        {isActive ? 'مباشر' : 'مغلق'}
                    </Text>
                </View>
                {!isEnded && (
                    <View style={styles.timerBadge}>
                        <Text style={styles.timerText}>⏱ {countdown}</Text>
                    </View>
                )}
            </View>

            {/* اسم السيارة */}
            <Text style={styles.carName} numberOfLines={1}>{carName.trim()}</Text>

            {/* تفاصيل السعر */}
            <View style={styles.priceSection}>
                <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>آخر مزايدة</Text>
                    <Text style={styles.priceValue}>
                        {currentPrice.toLocaleString('ar-SA')} ر.س
                    </Text>
                </View>
                <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>عدد المزايدات</Text>
                    <Text style={styles.bidCount}>{bids}</Text>
                </View>
            </View>

            {/* زر المزايدة */}
            {isActive && (
                <TouchableOpacity style={styles.bidBtn} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#d4b880', '#c9a96e', '#b8935a']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.bidBtnGradient}
                    >
                        <Text style={styles.bidBtnText}>🔨 زايد الآن</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

export default function AuctionsScreen() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

    useEffect(() => { loadAuctions(); }, []);

    async function loadAuctions() {
        try {
            const res = await api.auctions.getAll({ limit: '30' });
            const list = res.data || res.auctions || [];
            setAuctions(list);
        } catch {
            setAuctions([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const filtered = filter === 'all'
        ? auctions
        : auctions.filter(a => filter === 'active' ? a.status === 'active' : a.status !== 'active');

    const filters: { key: typeof filter; label: string }[] = [
        { key: 'all', label: 'الكل' },
        { key: 'active', label: '🔴 مباشر' },
        { key: 'ended', label: '⚫ منتهي' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <LinearGradient colors={['#0d0d0d', '#000']} style={styles.header}>
                <Text style={styles.headerTitle}>⚡ المزادات</Text>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>
                        {auctions.filter(a => a.status === 'active').length} مباشر
                    </Text>
                </View>
            </LinearGradient>

            {/* فلتر */}
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
                    <Text style={styles.emptyEmoji}>⚡</Text>
                    <Text style={styles.emptyText}>لا توجد مزادات حالياً</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <AuctionCard item={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadAuctions(); }}
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
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    liveText: { fontSize: 12, color: '#ef4444', fontWeight: '700' },

    filterRow: {
        flexDirection: 'row', paddingHorizontal: 16,
        paddingVertical: 12, gap: 8,
    },
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
        marginBottom: 14, overflow: 'hidden',
        padding: 16,
    },
    cardGradient: { ...StyleSheet.absoluteFillObject },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 10,
    },
    activeBadge: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
    endedBadge: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statusDot: { fontSize: 10 },
    statusText: { fontSize: 11, fontWeight: '800' },
    activeText: { color: '#ef4444' },
    endedText: { color: 'rgba(255,255,255,0.3)' },
    timerBadge: {
        backgroundColor: 'rgba(201,169,110,0.1)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)',
        borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    },
    timerText: { fontSize: 12, color: '#c9a96e', fontWeight: '800', fontVariant: ['tabular-nums'] },

    carName: { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 14, textAlign: 'right' },

    priceSection: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    priceBox: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12, padding: 12, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    priceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginBottom: 4 },
    priceValue: { fontSize: 13, color: '#c9a96e', fontWeight: '900' },
    bidCount: { fontSize: 20, color: '#60a5fa', fontWeight: '900' },

    bidBtn: { borderRadius: 14, overflow: 'hidden' },
    bidBtnGradient: { paddingVertical: 14, alignItems: 'center' },
    bidBtnText: { fontSize: 15, fontWeight: '900', color: '#000' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 13 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },
});
