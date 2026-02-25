'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        // الاتصال بالخادم (استبدل بالرابط الفعلي في الإنتاج)
        const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002', {
            transports: ['websocket'],
            reconnection: true,
        });

        socketInstance.on('connect', () => {
            console.log('✅ Connected to Real-time Server');
            setIsConnected(true);

            // إذا كان المستخدم أدمن، ينضم لغرفة الأدمن لتلقي التنبيهات
            if (user?.role === 'admin') {
                socketInstance.emit('join_room', 'admin_room');
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Disconnected from Real-time Server');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.role]);

    // إرسال حدث تسجيل الدخول عند الدخول الأول للمنصة
    useEffect(() => {
        if (isLoggedIn && user && socket && isConnected) {
            socket.emit('user_login', {
                id: (user as any)._id || (user as any).id,
                name: user.name,
                role: user.role,
                timestamp: new Date()
            });
        }
    }, [isLoggedIn, user, socket, isConnected]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
