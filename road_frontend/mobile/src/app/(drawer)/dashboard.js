import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { Map, Wallet, AlertTriangle } from 'lucide-react-native';
import { getAllRoads } from '@/api/roads';
import { getAllBudgets } from '@/api/budgets';
import { getAllComplaints } from '@/api/complaints';
import { Colors } from '@/constants/Colors';
export default function DashboardScreen() {
  const [stats, setStats] = useState({
    roads: 0,
    budget: 0,
    complaints: 0
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentRoads, setRecentRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [roads, budgets, complaints] = await Promise.all([getAllRoads().catch(() => []), getAllBudgets().catch(() => []), getAllComplaints().catch(() => [])]);
        const totalBudget = Array.isArray(budgets) ? budgets.reduce((acc, curr) => acc + (Number(curr.sanctionedAmount) || 0), 0) : 0;
        if (isMounted) {
          setStats({
            roads: Array.isArray(roads) ? roads.length : 0,
            budget: totalBudget,
            complaints: Array.isArray(complaints) ? complaints.length : 0
          });
          setRecentComplaints(Array.isArray(complaints) ? complaints.slice(-5).reverse() : []);
          setRecentRoads(Array.isArray(roads) ? roads.slice(-5).reverse() : []);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  if (loading) {
    return <View style={[styles.center, {
      backgroundColor: colors.background
    }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
        color: colors.text,
        marginTop: 10
      }}>Loading dashboard...</Text>
      </View>;
  }
  return <ScrollView style={[styles.container, {
    backgroundColor: colors.background
  }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, {
      color: colors.text
    }]}>Dashboard Overview</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
          <View style={[styles.statIconContainer, {
          backgroundColor: colors.primaryGlow
        }]}>
            <Map size={24} color={colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, {
            color: colors.text
          }]}>{stats.roads}</Text>
            <Text style={[styles.statLabel, {
            color: colors.textSecondary
          }]}>Total Roads Monitored</Text>
          </View>
        </View>

        <View style={[styles.statCard, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
          <View style={[styles.statIconContainer, {
          backgroundColor: 'rgba(34, 197, 94, 0.1)'
        }]}>
            <Wallet size={24} color={colors.success} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, {
            color: colors.text
          }]}>${stats.budget.toLocaleString()}</Text>
            <Text style={[styles.statLabel, {
            color: colors.textSecondary
          }]}>Total Allocated Budget</Text>
          </View>
        </View>

        <View style={[styles.statCard, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
          <View style={[styles.statIconContainer, {
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        }]}>
            <AlertTriangle size={24} color={colors.danger} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, {
            color: colors.text
          }]}>{stats.complaints}</Text>
            <Text style={[styles.statLabel, {
            color: colors.textSecondary
          }]}>Active Complaints</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder
    }]}>
        <Text style={[styles.cardTitle, {
        color: colors.text
      }]}>Recent Complaints</Text>
        <Text style={[styles.cardSubtitle, {
        color: colors.textSecondary
      }]}>Latest issues reported</Text>
        
        {recentComplaints.length > 0 ? recentComplaints.map((complaint, index) => <View key={index} style={[styles.listItem, {
        backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
      }]}>
              <View style={{
          flex: 1
        }}>
                <Text style={[styles.itemTitle, {
            color: colors.text
          }]}>{complaint.description || complaint.title || `Complaint #${complaint.id || index}`}</Text>
                <Text style={[styles.itemSubtitle, {
            color: colors.textMuted
          }]}>Status: {complaint.status || 'Pending'}</Text>
              </View>
              <View style={[styles.badge, {
          backgroundColor: complaint.status === 'Resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'
        }]}>
                <Text style={[styles.badgeText, {
            color: complaint.status === 'Resolved' ? colors.success : colors.warning
          }]}>{complaint.severity || 'Normal'}</Text>
              </View>
            </View>) : <Text style={[styles.emptyText, {
        color: colors.textMuted
      }]}>No recent complaints.</Text>}
      </View>

      <View style={[styles.card, {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder
    }]}>
        <Text style={[styles.cardTitle, {
        color: colors.text
      }]}>Recent Roads</Text>
        <Text style={[styles.cardSubtitle, {
        color: colors.textSecondary
      }]}>Latest monitored roads</Text>
        
        {recentRoads.length > 0 ? recentRoads.map((road, index) => <View key={index} style={[styles.listItem, {
        backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
      }]}>
              <View style={{
          flex: 1
        }}>
                <Text style={[styles.itemTitle, {
            color: colors.text
          }]}>{road.name || `Road #${road.id || index}`}</Text>
                <Text style={[styles.itemSubtitle, {
            color: colors.textMuted
          }]}>Location: {road.location || road.type || 'Unknown'}</Text>
              </View>
              <View style={[styles.badge, {
          backgroundColor: 'rgba(59, 130, 246, 0.2)'
        }]}>
                <Text style={[styles.badgeText, {
            color: '#60a5fa'
          }]}>{road.length ? `${road.length} km` : 'Active'}</Text>
              </View>
            </View>) : <Text style={[styles.emptyText, {
        color: colors.textMuted
      }]}>No roads monitored yet.</Text>}
      </View>

    </ScrollView>;
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
  content: {
    padding: 16,
    gap: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  statsContainer: {
    gap: 12
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statInfo: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: 14
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 16
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  itemTitle: {
    fontWeight: '500',
    fontSize: 16
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  emptyText: {
    textAlign: 'center',
    padding: 24
  }
});