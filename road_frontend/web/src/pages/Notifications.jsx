import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle } from 'lucide-react';
import { getAllNotifications, deleteNotification } from '../api/notifications';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  if (loading) return <div className="animate-fade-in">Loading notifications...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bell size={28} color="var(--primary-color)" />
          <h1 style={{ margin: 0 }}>System Notifications</h1>
        </div>
        <span className="badge badge-primary">{notifications.length} Unread</span>
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>You're all caught up! No new notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="card" 
                style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderLeft: '4px solid var(--primary-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{notification.title || 'Alert'}</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{notification.message}</p>
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => handleDelete(notification.id)} title="Dismiss">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
