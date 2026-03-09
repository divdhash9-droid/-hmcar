// screens/CarsScreen.tsx - شاشة تصفح السيارات
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, Image,
    StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Car {
    _id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage?: number;
    status?: string;
    images?: string[];
    transmission?: string;
    fuel?: string;
}

const TRANSMISSION_MAP: Record<string, string> = {
    automatic: 'أوتوماتيك',
    manual: 'يدوي',
    cvt: 'CVT',
};

const FUEL_MAP: Record<string, string> = {
    gasoline: 'بنزين',
    diesel: 'ديزل',
    electric: 'كهربائي',
    hybrid: 'هجين',
};

export default function CarsScreen() {
    const [cars, setCars] = useState<Car[]>([]);
    const [filtered, setFiltered] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'year'>('year');

    useEffect(() => { loadCars(); }, []);

    useEffect(() => {
        filterAndSort();
    }, [cars, search, sortBy]);

    async function loadCars() {
        try {
            const res = await api.cars.getAll({ limit: '50' });
            const list = res.data?.cars || res.cars || res.data || [];
            setCars(list);
        } catch {
            setCars([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function filterAndSort() {
        let list = [...cars];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.make?.toLowerCase().includes(q) ||
                c.model?.toLowerCase().includes(q) ||
                String(c.year).includes(q)
            );
        }
        if (sortBy === 'price_asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (sortBy === 'price_desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
        else list.sort((a, b) => (b.year || 0) - (a.year || 0));
        setFiltered(list);
    }

    const formatPrice = (p: number) =>
        p ? p.toLocaleString('ar-SA') + ' ر.س' : 'اتصل للسعر';

    const renderCar = useCallback(({ item }: { item: Car }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            {/* صورة السيارة */}
            <View style={styles.imageContainer}>
                {item.images && item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.carImage} resizeMode="cover" />
                ) : (
                    <View style={styles.noImageBox}>
                        <Text style={styles.noImageEmoji}>🚗</Text>
                    </View>
                )}
                {item.status === 'available' && (
                    <View style={styles.availableBadge}>
                        <Text style={styles.availableBadgeText}>متاح</Text>
                    </View>
                )}
            </View>
            {/* معلومات السيارة */}
            <View style={styles.cardInfo}>
                <Text style={styles.carName} numberOfLines={1}>
                    {item.make} {item.model}
                </Text>
                <Text style={styles.carYear}>{item.year}</Text>
                {item.mileage != null && (
                    <Text style={styles.carMileage}>
                        {item.mileage.toLocaleString('ar-SA')} كم
                    </Text>
                )}
                <View style={styles.cardFooter}>
                    <Text style={styles.carPrice}>{formatPrice(item.price)}</Text>
                </View>
                {(item.transmission || item.fuel) && (
                    <View style={styles.tagsRow}>
                        {item.transmission && (
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                    {TRANSMISSION_MAP[item.transmission] || item.transmission}
                                </Text>
                            </View>
                        )}
                        {item.fuel && (
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                    {FUEL_MAP[item.fuel] || item.fuel}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    ), []);

    const sortOptions: { key: typeof sortBy; label: string }[] = [
        { key: 'year', label: 'الأحدث' },
        { key: 'price_asc', label: 'الأرخص' },
        { key: 'price_desc', label: 'الأغلى' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <LinearGradient colors={['#0d0d0d', '#000']} style={styles.header}>
                <Text style={styles.headerTitle}>🚗 السيارات</Text>
                <Text style={styles.headerCount}>
                    {filtered.length} سيارة
                </Text>
            </LinearGradient>

            {/* شريط البحث */}
            <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="ابحث بالماركة أو الموديل..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    textAlign="right"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* أزرار الترتيب */}
            <View style={styles.sortRow}>
                {sortOptions.map(opt => (
                    <TouchableOpacity
                        key={opt.key}
                        style={[styles.sortBtn, sortBy === opt.key && styles.sortBtnActive]}
                        onPress={() => setSortBy(opt.key)}
                    >
                        <Text style={[styles.sortBtnText, sortBy === opt.key && styles.sortBtnTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* قائمة السيارات */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#c9a96e" size="large" />
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>🚗</Text>
                    <Text style={styles.emptyText}>
                        {search ? 'لا توجد نتائج' : 'لا توجد سيارات'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={renderCar}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadCars(); }}
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

    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 16, marginVertical: 12, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 2,
    },
    searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.5 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 12 },
    clearBtn: { fontSize: 14, color: 'rgba(255,255,255,0.3)', padding: 4 },

    sortRow: {
        flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8,
    },
    sortBtn: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 10, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    sortBtnActive: {
        backgroundColor: 'rgba(201,169,110,0.15)',
        borderColor: 'rgba(201,169,110,0.4)',
    },
    sortBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '700' },
    sortBtnTextActive: { color: '#c9a96e' },

    // القائمة
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    row: { justifyContent: 'space-between', marginBottom: 12 },

    // البطاقة
    card: {
        width: CARD_WIDTH,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    imageContainer: { position: 'relative' },
    carImage: { width: CARD_WIDTH, height: CARD_WIDTH * 0.65 },
    noImageBox: {
        width: CARD_WIDTH, height: CARD_WIDTH * 0.65,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center', justifyContent: 'center',
    },
    noImageEmoji: { fontSize: 36 },
    availableBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: 'rgba(52,211,153,0.9)',
        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    },
    availableBadgeText: { fontSize: 9, fontWeight: '800', color: '#000' },

    cardInfo: { padding: 12 },
    carName: { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 2, textAlign: 'right' },
    carYear: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2, textAlign: 'right' },
    carMileage: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 6, textAlign: 'right' },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    carPrice: { fontSize: 12, fontWeight: '900', color: '#c9a96e' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, justifyContent: 'flex-end' },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    },
    tagText: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

    // فارغ / تحميل
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 13 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },
});
