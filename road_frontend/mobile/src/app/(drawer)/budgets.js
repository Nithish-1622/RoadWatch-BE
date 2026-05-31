import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { getAllBudgets, createBudget, updateBudget, deleteBudget } from '@/api/budgets';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBudget, setNewBudget] = useState({
    sanctionedAmount: '',
    roadId: '',
    contractorId: '',
    tenderReference: '',
    sanctionDate: ''
  });
  const {
    user
  } = useContext(AuthContext);
  const isCitizen = user?.role === 'CITIZEN';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  useEffect(() => {
    fetchBudgets();
  }, []);
  const fetchBudgets = async () => {
    try {
      const data = await getAllBudgets();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch budgets', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!newBudget.sanctionedAmount || !newBudget.roadId || !newBudget.contractorId) {
      Alert.alert('Error', 'Amount, Road ID, and Contractor ID are required');
      return;
    }
    try {
      const payload = {
        sanctionedAmount: Number(newBudget.sanctionedAmount),
        roadId: Number(newBudget.roadId),
        contractorId: Number(newBudget.contractorId),
        tenderReference: newBudget.tenderReference,
        sanctionDate: new Date(newBudget.sanctionDate || new Date()).toISOString()
      };
      let response;
      if (editingId) {
        response = await updateBudget(editingId, payload);
      } else {
        response = await createBudget(payload);
      }
      if (response === null || response === '') {
        Alert.alert("Error", "Failed to save budget. Please check if the Contractor ID exists.");
        return;
      }
      setShowModal(false);
      setEditingId(null);
      setNewBudget({
        sanctionedAmount: '',
        roadId: '',
        contractorId: '',
        tenderReference: '',
        sanctionDate: ''
      });
      fetchBudgets();
    } catch (error) {
      console.error('Failed to save budget', error);
      Alert.alert('Error', error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save budget');
    }
  };
  const handleEditClick = budget => {
    const formattedDate = budget.sanctionDate ? new Date(budget.sanctionDate).toISOString().split('T')[0] : '';
    setNewBudget({
      sanctionedAmount: budget.sanctionedAmount?.toString() || '',
      roadId: budget.roadId?.toString() || '',
      contractorId: (budget.contractor?.id || budget.contractorId || '').toString(),
      tenderReference: budget.tenderReference || '',
      sanctionDate: formattedDate
    });
    setEditingId(budget.id);
    setShowModal(true);
  };
  const handleDelete = id => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this budget allocation?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteBudget(id);
          fetchBudgets();
        } catch (error) {
          console.error('Failed to delete budget', error);
        }
      }
    }]);
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
        <Text style={[styles.title, {
        color: colors.text
      }]}>Budget Management</Text>
        {!isCitizen && <TouchableOpacity style={[styles.addButton, {
        backgroundColor: colors.primary
      }]} onPress={() => {
        setEditingId(null);
        setNewBudget({
          sanctionedAmount: '',
          roadId: '',
          contractorId: '',
          tenderReference: '',
          sanctionDate: ''
        });
        setShowModal(true);
      }}>
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Allocate</Text>
          </TouchableOpacity>}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {budgets.length === 0 ? <Text style={[styles.emptyText, {
        color: colors.textMuted
      }]}>No budgets found.</Text> : budgets.map(budget => <View key={budget.id} style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Wallet size={20} color={colors.success} />
                  <Text style={[styles.cardTitle, {
              color: colors.text
            }]}>${budget.sanctionedAmount?.toLocaleString() || 0}</Text>
                </View>
                <View style={[styles.badge, {
            backgroundColor: 'rgba(34, 197, 94, 0.1)'
          }]}>
                  <Text style={[styles.badgeText, {
              color: colors.success
            }]}>Approved</Text>
                </View>
              </View>
              
              <Text style={[styles.cardSubtitle, {
          color: colors.textSecondary
        }]}>ID: #{budget.id} | Road: #{budget.roadId}</Text>
              
              {!isCitizen && <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEditClick(budget)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }]}>
                    <Edit2 size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(budget.id)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }]}>
                    <Trash2 size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>}
            </View>)}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center'
        }}>
            <View style={[styles.modalContent, {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder
          }]}>
              <Text style={[styles.modalTitle, {
              color: colors.text
            }]}>{editingId ? 'Edit Budget' : 'Allocate New Budget'}</Text>
              
              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Amount ($)</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newBudget.sanctionedAmount} onChangeText={text => setNewBudget({
              ...newBudget,
              sanctionedAmount: text
            })} placeholder="Enter amount" keyboardType="numeric" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Target Road ID</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newBudget.roadId} onChangeText={text => setNewBudget({
              ...newBudget,
              roadId: text
            })} placeholder="Enter road ID" keyboardType="numeric" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Contractor ID</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newBudget.contractorId} onChangeText={text => setNewBudget({
              ...newBudget,
              contractorId: text
            })} placeholder="Enter contractor ID" keyboardType="numeric" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Tender Reference</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newBudget.tenderReference} onChangeText={text => setNewBudget({
              ...newBudget,
              tenderReference: text
            })} placeholder="Enter tender reference" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Sanction Date (YYYY-MM-DD)</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newBudget.sanctionDate} onChangeText={text => setNewBudget({
              ...newBudget,
              sanctionDate: text
            })} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, {
                backgroundColor: colors.surfaceBorder
              }]} onPress={() => setShowModal(false)}>
                  <Text style={{
                  color: colors.text
                }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit}>
                  <LinearGradient colors={[colors.primary, colors.secondary]} start={{
                  x: 0,
                  y: 0
                }} end={{
                  x: 1,
                  y: 1
                }} style={[styles.modalBtn, {
                  borderWidth: 0
                }]}>
                    <Text style={{
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>{editingId ? 'Save' : 'Save Budget'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  listContainer: {
    padding: 16,
    gap: 12
  },
  emptyText: {
    textAlign: 'center',
    padding: 24
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 16
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    margin: 24,
    marginTop: 64,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8
  }
});