import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useRestaurant } from './RestaurantContext';
import { toast } from 'sonner';

// Define types
export interface Notification {
    id: number;
    type: 'system' | 'order' | 'inventory' | 'revenue';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { restaurant } = useRestaurant();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize socket and listeners
    useEffect(() => {
        if (!restaurant) return;

        const newSocket = io(apiUrl);
        setSocket(newSocket);

        // Join restaurant room for specific alerts
        newSocket.emit('join:restaurant', restaurant.id);
        console.log(`[NOTIFICATIONS] Joined room for restaurant ${restaurant.id}`);

        // Listen for new notifications
        newSocket.on('notification:new', (notification: Notification) => {
            console.log('[NOTIFICATIONS] Received real-time alert:', notification);

            // Add to list immediately
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast
            toast(notification.title, {
                description: notification.message,
                action: {
                    label: 'Mark Read',
                    onClick: () => markAsRead(notification.id)
                }
            });

            // Play sound
            const audio = new Audio('/notification.mp3'); // Optional: Add a sound file later
            audio.play().catch(e => console.log('Audio play failed', e));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [restaurant]);

    // Initial fetch
    useEffect(() => {
        if (restaurant) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [restaurant]);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${apiUrl}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${apiUrl}/api/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            const token = localStorage.getItem('token');
            await axios.patch(`${apiUrl}/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error marking as read:', error);
            // Revert if failed (optional, but keep simple for now)
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                isLoading
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
