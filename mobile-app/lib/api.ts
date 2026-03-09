// lib/api.ts - رابط بنفس API الموقع
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://car-auction-sand.vercel.app/api';

async function getToken(): Promise<string | null> {
    return AsyncStorage.getItem('hm_token');
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export const api = {
    auth: {
        login: (body: { identifier: string; password: string; role?: string; deviceId?: string }) =>
            request<any>('/v2/auth/login', { method: 'POST', body: JSON.stringify(body) }),

        autoLogin: (body: { name: string; password: string; deviceId?: string }) =>
            request<any>('/v2/auth/auto-login', { method: 'POST', body: JSON.stringify(body) }),

        me: () => request<any>('/v2/auth/me'),
    },

    dashboard: {
        getClientData: () => request<any>('/v2/dashboard/client'),
    },

    cars: {
        getAll: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any>(`/v2/cars${query}`);
        },
        getById: (id: string) => request<any>(`/v2/cars/${id}`),
    },

    auctions: {
        getAll: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any>(`/v2/auctions${query}`);
        },
        getById: (id: string) => request<any>(`/v2/auctions/${id}`),
        placeBid: (id: string, amount: number) =>
            request<any>(`/v2/auctions/${id}/bid`, { method: 'POST', body: JSON.stringify({ amount }) }),
    },

    orders: {
        getMyOrders: () => request<any>('/v2/orders/my'),
    },

    favorites: {
        getAll: () => request<any>('/v2/favorites'),
        toggle: (carId: string) =>
            request<any>('/v2/favorites/toggle', { method: 'POST', body: JSON.stringify({ carId }) }),
    },

    alerts: {
        getAll: () => request<any>('/v2/smart-alerts'),
        create: (data: any) =>
            request<any>('/v2/smart-alerts', { method: 'POST', body: JSON.stringify(data) }),
        toggle: (id: string) =>
            request<any>(`/v2/smart-alerts/${id}/toggle`, { method: 'PATCH' }),
        delete: (id: string) =>
            request<any>(`/v2/smart-alerts/${id}`, { method: 'DELETE' }),
    },

    profile: {
        update: (data: any) =>
            request<any>('/v2/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
        get: () => request<any>('/v2/auth/me'),
    },
};
