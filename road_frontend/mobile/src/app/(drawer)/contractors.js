import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Plus, Edit2, Trash2, Users } from 'lucide-react-native';
import { getAllContractors, createContractor, updateContractor, deleteContractor } from '@/api/budgets';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
export default function ContractorsScreen() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newContractor, setNewContractor] = useState({
    name: '',
    licenseNumber: '',
    email: '',
    phone: ''
  });
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  useEffect(() => {
    fetchContractors();
  }, []);
  const fetchContractors = async () => {
    try {
      const data = await getAllContractors();
      setContractors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch contractors', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!newContractor.name || !newContractor.licenseNumber) {
      Alert.alert('Error', 'Name and License Number are required');
      return;
    }
    try {
      const payload = {
        name: newContractor.name,
        licenseNumber: newContractor.licenseNumber,
        email: newContractor.email,
        phone: newContractor.phone
      };
      if (editingId) {
        await updateContractor(editingId, payload);
      } else {
        await createContractor(payload);
      }
      setShowModal(false);
      setEditingId(null);
      setNewContractor({
        name: '',
        licenseNumber: '',
        email: '',
        phone: ''
      });
      fetchContractors();
    } catch (error) {
      console.error('Failed to save contractor', error);
      Alert.alert('Error', error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save contractor');
    }
  };
  const handleEditClick = contractor => {
    setNewContractor({
      name: contractor.name || '',
      licenseNumber: contractor.licenseNumber || '',
      email: contractor.email || '',
      phone: contractor.phone || ''
    });
    setEditingId(contractor.id);
    setShowModal(true);
  };
  const handleDelete = id => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this contractor?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteContractor(id);
          fetchContractors();
        } catch (error) {
          console.error('Failed to delete contractor', error);
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
      }]}>Contractors</Text>
        <TouchableOpacity style={[styles.addButton, {
        backgroundColor: colors.primary
      }]} onPress={() => {
        setEditingId(null);
        setNewContractor({
          name: '',
          licenseNumber: '',
          email: '',
          phone: ''
        });
        setShowModal(true);
      }}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {contractors.length === 0 ? <Text style={[styles.emptyText, {
        color: colors.textMuted
      }]}>No contractors found.</Text> : contractors.map(contractor => <View key={contractor.id} style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Users size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, {
              color: colors.text
            }]}>{contractor.name}</Text>
                </View>
                <Text style={[styles.cardSubtitle, {
            color: colors.textSecondary
          }]}>#{contractor.licenseNumber}</Text>
              </View>
              
              <Text style={[styles.infoText, {
          color: colors.textSecondary
        }]}>Email: {contractor.email}</Text>
              <Text style={[styles.infoText, {
          color: colors.textSecondary
        }]}>Phone: {contractor.phone}</Text>
              <Text style={[styles.infoText, {
          color: colors.textMuted,
          marginTop: 4
        }]}>ID: #{contractor.id}</Text>
              
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEditClick(contractor)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }]}>
                  <Edit2 size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(contractor.id)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }]}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
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
            }]}>{editingId ? 'Edit Contractor' : 'Add New Contractor'}</Text>
              
              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Name</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newContractor.name} onChangeText={text => setNewContractor({
              ...newContractor,
              name: text
            })} placeholder="Contractor Name" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>License Number</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newContractor.licenseNumber} onChangeText={text => setNewContractor({
              ...newContractor,
              licenseNumber: text
            })} placeholder="License Number" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Email</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newContractor.email} onChangeText={text => setNewContractor({
              ...newContractor,
              email: text
            })} placeholder="Email Address" keyboardType="email-address" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Phone</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newContractor.phone} onChangeText={text => setNewContractor({
              ...newContractor,
              phone: text
            })} placeholder="Phone Number" keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />

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
                  }}>{editingId ? 'Save' : 'Create'}</Text>
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
    fontWeight: '500'
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
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