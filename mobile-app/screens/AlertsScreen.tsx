// screens/AlertsScreen.tsx - شاشة التنبيهات الذكية
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Switch, RefreshControl, ActivityIndicator, StatusBar,
    Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

interface SmartAlert {
    _id: string;
    name?: string;
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    isActive?: boolean;
    matchCount?: number;
    createdAt?: string;
}

interface NewAlert {
    name: string;
    make: string;
    model: string;
    priceMax: string;
}

function AlertCard({
    item, onToggle, onDelete,
}: {
    item: SmartAlert;
    onToggle: (id: string, active: boolean) => void;
    onDelete: (id: string) => void;
}) {
    const criteria = [
        item.make && `الماركة: ${item.make}`,
        item.model && `الموديل: ${item.model}`,
        (item.yearMin || item.yearMax) && `السنة: ${item.yearMin || ''}${item.yearMax ? ' - ' + item.yearMax : ''}`,
        (item.priceMin || item.priceMax) && `السعر: ${item.priceMax ? 'حتى ' + item.priceMax.toLocaleString('ar-SA') + ' ر.س' : ''}`,
    ].filter(Boolean);

    return (
        <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={styles.cardHeader}>
                <Switch
                    value={!!item.isActive}
                    onValueChange={(val) => onToggle(item._id, val)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(201,169,110,0.4)' }}
                    thumbColor={item.isActive ? '#c9a96e' : '#555'}
                />
                <Text style={[styles.alertName, !item.isActive && styles.inactiveText]} numberOfLines={1}>
                    {item.name || 'تنبيه'}
                </Text>
            </View>

            <View style={styles.criteriaList}>
                {criteria.map((c, i) => (
                    <View key={i} style={styles.criteriaTag}>
                        <Text style={styles.criteriaText}>{c as string}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.cardFooter}>
                {item.matchCount != null && (
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>
                            🎯 {item.matchCount} مطابقة
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => Alert.alert('حذف التنبيه', 'هل أنت متأكد؟', [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'حذف', style: 'destructive', onPress: () => onDelete(item._id) },
                    ])}
                >
                    <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newAlert, setNewAlert] = useState<NewAlert>({ name: '', make: '', model: '', priceMax: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadAlerts(); }, []);

    async function loadAlerts() {
        try {
            const res = await api.alerts.getAll();
            const list = res.data?.alerts || res.alerts || res.data || [];
            setAlerts(list);
        } catch {
            setAlerts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function handleToggle(id: string, active: boolean) {
        setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: active } : a));
        try {
            await api.alerts.toggle(id);
        } catch {
            // Revert on error
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: !active } : a));
        }
    }

    async function handleDelete(id: string) {
        setAlerts(prev => prev.filter(a => a._id !== id));
        try {
            await api.alerts.delete(id);
        } catch {
            loadAlerts();
        }
    }

    async function handleCreate() {
        if (!newAlert.make.trim() && !newAlert.model.trim()) {
            Alert.alert('تنبيه', 'أدخل الماركة أو الموديل على الأقل');
            return;
        }
        setSaving(true);
        try {
            const payload: any = { name: newAlert.name || 'تنبيه جديد' };
            if (newAlert.make) payload.make = newAlert.make;
            if (newAlert.model) payload.model = newAlert.model;
            if (newAlert.priceMax) payload.priceMax = Number(newAlert.priceMax);
            await api.alerts.create(payload);
            setShowModal(false);
            setNewAlert({ name: '', make: '', model: '', priceMax: '' });
            loadAlerts();
        } catch {
            Alert.alert('خطأ', 'فشل إنشاء التنبيه');
        } finally {
            setSaving(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <LinearGradient colors={['#0d0d0d', '#000']} style={styles.header}>
                <Text style={styles.headerTitle}>🔔 التنبيهات</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                    <LinearGradient
                        colors={['#d4b880', '#c9a96e']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.addBtnGradient}
                    >
                        <Text style={styles.addBtnText}>+ إضافة</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>

            {/* إحصائيات */}
            <View style={styles.statsRow}>
                <View style={styles.statPill}>
                    <Text style={styles.statNum}>{alerts.length}</Text>
                    <Text style={styles.statLabel}>إجمالي</Text>
                </View>
                <View style={styles.statPill}>
                    <Text style={[styles.statNum, { color: '#34d399' }]}>
                        {alerts.filter(a => a.isActive).length}
                    </Text>
                    <Text style={styles.statLabel}>نشط</Text>
                </View>
                <View style={styles.statPill}>
                    <Text style={[styles.statNum, { color: '#60a5fa' }]}>
                        {alerts.reduce((sum, a) => sum + (a.matchCount || 0), 0)}
                    </Text>
                    <Text style={styles.statLabel}>مطابقة</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#c9a96e" size="large" />
                </View>
            ) : alerts.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>🔔</Text>
                    <Text style={styles.emptyTitle}>لا توجد تنبيهات</Text>
                    <Text style={styles.emptySubtitle}>أنشئ تنبيهاً ليصلك إشعار عند توافر سيارة تناسبك</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                        <Text style={styles.emptyBtnText}>+ إنشاء أول تنبيه</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <AlertCard item={item} onToggle={handleToggle} onDelete={handleDelete} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadAlerts(); }}
                            tintColor="#c9a96e"
                        />
                    }
                />
            )}

            {/* Modal إضافة تنبيه */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>🔔 تنبيه جديد</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {[
                                { key: 'name', label: 'اسم التنبيه', placeholder: 'مثال: سيارة فاملية اقتصادية' },
                                { key: 'make', label: 'الماركة', placeholder: 'مثال: Toyota, BMW, Mercedes' },
                                { key: 'model', label: 'الموديل', placeholder: 'مثال: Camry, X5' },
                                { key: 'priceMax', label: 'الحد الأقصى للسعر (ر.س)', placeholder: '150000', numeric: true },
                            ].map(field => (
                                <View key={field.key} style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{field.label}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newAlert[field.key as keyof NewAlert]}
                                        onChangeText={v => setNewAlert(prev => ({ ...prev, [field.key]: v }))}
                                        placeholder={field.placeholder}
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType={field.numeric ? 'numeric' : 'default'}
                                        textAlign="right"
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>إلغاء</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleCreate}
                                disabled={saving}
                            >
                                <LinearGradient
                                    colors={['#d4b880', '#c9a96e']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.saveBtnGradient}
                                >
                                    {saving
                                        ? <ActivityIndicator color="#000" size="small" />
                                        : <Text style={styles.saveBtnText}>حفظ</Text>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    addBtn: { borderRadius: 10, overflow: 'hidden' },
    addBtnGradient: { paddingHorizontal: 14, paddingVertical: 8 },
    addBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },

    statsRow: {
        flexDirection: 'row', paddingHorizontal: 16,
        paddingVertical: 16, gap: 10,
    },
    statPill: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', paddingVertical: 12,
    },
    statNum: { fontSize: 22, fontWeight: '900', color: '#c9a96e', marginBottom: 3 },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },

    listContent: { padding: 16, paddingBottom: 100 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderWidth: 1,
        borderColor: 'rgba(201,169,110,0.15)',
        marginBottom: 12, padding: 16,
    },
    cardInactive: { borderColor: 'rgba(255,255,255,0.06)', opacity: 0.6 },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: 10, marginBottom: 12,
    },
    alertName: { flex: 1, fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'right' },
    inactiveText: { color: 'rgba(255,255,255,0.3)' },

    criteriaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', marginBottom: 12 },
    criteriaTag: {
        backgroundColor: 'rgba(201,169,110,0.08)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.15)',
    },
    criteriaText: { fontSize: 11, color: 'rgba(201,169,110,0.8)', fontWeight: '600' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    matchBadge: {
        backgroundColor: 'rgba(96,165,250,0.1)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)',
    },
    matchText: { fontSize: 11, color: '#60a5fa', fontWeight: '700' },
    deleteBtn: { padding: 6 },
    deleteIcon: { fontSize: 16 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    emptyBtn: {
        backgroundColor: 'rgba(201,169,110,0.15)',
        borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)',
    },
    emptyBtnText: { fontSize: 13, color: '#c9a96e', fontWeight: '800' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111', borderRadius: 28,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 24, paddingBottom: 36,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 20, textAlign: 'center' },

    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '700', marginBottom: 8, textAlign: 'right', letterSpacing: 0.5 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#fff', fontSize: 14,
        paddingHorizontal: 16, paddingVertical: 13,
    },

    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    cancelBtn: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, alignItems: 'center',
        paddingVertical: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cancelBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
    saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
    saveBtnGradient: { paddingVertical: 14, alignItems: 'center' },
    saveBtnText: { fontSize: 14, fontWeight: '900', color: '#000' },
});
