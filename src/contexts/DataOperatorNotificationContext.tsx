import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface DataOperatorNotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    relatedEntityType?: string;
    relatedEntityId?: string;
    priority?: string;
    senderName?: string;
}

interface DataOperatorNotificationContextType {
    notifications: DataOperatorNotificationItem[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const DataOperatorNotificationContext = createContext<DataOperatorNotificationContextType | undefined>(undefined);

export const useDataOperatorNotifications = () => {
    const context = useContext(DataOperatorNotificationContext);
    if (!context) {
        throw new Error('useDataOperatorNotifications must be used within a DataOperatorNotificationProvider');
    }
    return context;
};

export const DataOperatorNotificationProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, user } = useAuth();
    const [notifications, setNotifications] = useState<DataOperatorNotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated || !user || user.type !== 'data_operator') {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setLoading(true);
        try {
            const config = {
                headers: {} as any
            };

            const userId = user?.user_id || user?.id;
            if (userId) {
                config.headers['X-User-Id'] = userId.toString();
            }

            const response = await api.get('/data-operator/notifications', config);
            console.log('Data Operator Notification API Response:', response.data);

            if (response.data.success) {
                let rawData = [];
                // Check for notifications array in data.notifications (our API structure)
                if (response.data.data && Array.isArray(response.data.data.notifications)) {
                    rawData = response.data.data.notifications;
                } else if (response.data.data && Array.isArray(response.data.data.data)) {
                    rawData = response.data.data.data;
                } else if (Array.isArray(response.data.data)) {
                    rawData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    rawData = response.data;
                }

                console.log('Parsed notifications data:', rawData);

                if (Array.isArray(rawData)) {
                    const mappedNotifications = rawData.map((n: any) => ({
                        id: (n.notification_id || n.id) ? (n.notification_id || n.id).toString() : Math.random().toString(),
                        type: n.notification_type || 'system',
                        title: n.title || 'নোটিফিকেশন',
                        message: n.message || '',
                        time: n.created_at ? formatTimeAgo(n.created_at) : '',
                        read: n.is_read === 1 || n.is_read === true || n.is_read === '1',
                        relatedEntityType: n.related_entity_type,
                        relatedEntityId: n.related_entity_id?.toString(),
                        priority: n.priority,
                        senderName: n.sender_name
                    }));
                    setNotifications(mappedNotifications);

                    const unread = mappedNotifications.filter((n: DataOperatorNotificationItem) => !n.read).length;
                    setUnreadCount(unread);
                } else {
                    console.error('Unexpected notification data format:', response.data);
                    setNotifications([]);
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch data operator notifications:', error);
            if (error.response?.status === 401) {
                console.log('Token invalid');
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, read: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            const config = {
                headers: {} as any
            };

            const userId = user?.user_id || user?.id;
            if (userId) {
                config.headers['X-User-Id'] = userId.toString();
            }

            await api.post(`/data-operator/notifications/${id}/read`, {}, config);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );
            setUnreadCount(0);

            const config = {
                headers: {} as any
            };

            const userId = user?.user_id || user?.id;
            if (userId) {
                config.headers['X-User-Id'] = userId.toString();
            }

            await api.post('/data-operator/notifications/read-all', {}, config);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    // Auto-fetch on mount and every 30 seconds
    useEffect(() => {
        if (isAuthenticated && user?.type === 'data_operator') {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user?.type, fetchNotifications]);

    return (
        <DataOperatorNotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead
            }}
        >
            {children}
        </DataOperatorNotificationContext.Provider>
    );
};

// Helper function to format time ago in Bangla
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const toBengaliNumber = (num: number): string => {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
    };

    if (diffMins < 1) {
        return 'এইমাত্র';
    } else if (diffMins < 60) {
        return `${toBengaliNumber(diffMins)} মিনিট আগে`;
    } else if (diffHours < 24) {
        return `${toBengaliNumber(diffHours)} ঘণ্টা আগে`;
    } else if (diffDays < 7) {
        return `${toBengaliNumber(diffDays)} দিন আগে`;
    } else {
        return date.toLocaleDateString('bn-BD');
    }
}
