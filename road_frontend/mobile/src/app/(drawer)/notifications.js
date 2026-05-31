import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Bell, Trash2, CheckCircle } from 'lucide-react-native';
import { getAllNotifications, deleteNotification } from '@/api/notifications';
import { Colors } from '@/constants/Colors';
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  useEffect(() => {
    fetchNotifications();
  }, []);
  const fetchNotifications = async () => {
    try {
      const data = await getAllNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async id => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };
  if (loading) {
    return <View style={[styles.center, {
      backgroundColor: colors.background
    }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>;
  }
  return <View style={[styles.container, {
    backgroundColor: colors.background
  }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={28} color={colors.primary} />
          <Text style={[styles.title, {
          color: colors.text
        }]}>Notifications</Text>
        </View>
        <View style={[styles.badge, {
        backgroundColor: colors.primary
      }]}>
          <Text style={styles.badgeText}>{notifications.length} Unread</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {notifications.length === 0 ? <View style={styles.emptyContainer}>
            <CheckCircle size={48} color={colors.textMuted} style={{
          marginBottom: 16
        }} />
            <Text style={[styles.emptyText, {
          color: colors.textSecondary
        }]}>You're all caught up! No new notifications.</Text>
          </View> : <View style={styles.resultsList}>
            {notifications.map(notification => <View key={notification.id} style={[styles.card, {
          backgroundColor: colors.surface,
          borderLeftColor: colors.primary,
          borderRightColor: colors.surfaceBorder,
          borderTopColor: colors.surfaceBorder,
          borderBottomColor: colors.surfaceBorder
        }]}>
                <View style={styles.content}>
                  <Text style={[styles.notificationTitle, {
              color: colors.text
            }]}>{notification.title || 'Alert'}</Text>
                  <Text style={[styles.notificationDesc, {
              color: colors.textSecondary
            }]}>{notification.message}</Text>
                </View>
                <TouchableOpacity style={[styles.actionBtn, {
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }]} onPress={() => handleDelete(notification.id)}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>)}
          </View>}
      </ScrollView>
    </View>;
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  listContainer: {
    padding: 16
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64
  },
  emptyText: {
    fontSize: 16
  },
  resultsList: {
    gap: 12
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4
  },
  content: {
    flex: 1,
    paddingRight: 16
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  notificationDesc: {
    fontSize: 14
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8
  }
});