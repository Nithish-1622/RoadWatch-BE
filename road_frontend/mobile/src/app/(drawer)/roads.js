import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react-native';
import { getAllRoads, createRoad, updateRoad, deleteRoad } from '@/api/roads';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
export default function RoadsScreen() {
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRoad, setNewRoad] = useState({
    name: '',
    category: 'NH',
    coordinates: '',
    authorityName: ''
  });
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  useEffect(() => {
    fetchRoads();
  }, []);
  const fetchRoads = async () => {
    try {
      const data = await getAllRoads();
      setRoads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch roads', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!newRoad.name) {
      Alert.alert('Error', 'Road name is required');
      return;
    }
    try {
      const payload = {
        name: newRoad.name,
        category: newRoad.category,
        coordinates: newRoad.coordinates || [{
          lat: 11.0168,
          lng: 76.9558
        }],
        authorityName: newRoad.authorityName || 'City Admin'
      };
      if (editingId) {
        await updateRoad(editingId, payload);
      } else {
        await createRoad(payload);
      }
      setShowModal(false);
      setEditingId(null);
      setNewRoad({
        name: '',
        category: 'NH',
        coordinates: '',
        authorityName: ''
      });
      fetchRoads();
    } catch (error) {
      console.error('Failed to save road', error);
      Alert.alert('Error', error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save road');
    }
  };
  const handleEditClick = road => {
    setNewRoad({
      name: road.name,
      category: road.category,
      coordinates: road.coordinates,
      authorityName: road.authorityName
    });
    setEditingId(road.id);
    setShowModal(true);
  };
  const handleDelete = id => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this road?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteRoad(id);
          fetchRoads();
        } catch (error) {
          console.error('Failed to delete road', error);
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
      }]}>Road Management</Text>
        <TouchableOpacity style={[styles.addButton, {
        backgroundColor: colors.primary
      }]} onPress={() => {
        setEditingId(null);
        setNewRoad({
          name: '',
          category: 'NH',
          coordinates: '',
          authorityName: ''
        });
        setShowModal(true);
      }}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {roads.length === 0 ? <Text style={[styles.emptyText, {
        color: colors.textMuted
      }]}>No roads found.</Text> : roads.map(road => <View key={road.id} style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MapPin size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, {
              color: colors.text
            }]}>{road.name}</Text>
                </View>
                <View style={[styles.badge, {
            backgroundColor: 'rgba(34, 197, 94, 0.1)'
          }]}>
                  <Text style={[styles.badgeText, {
              color: colors.success
            }]}>Active</Text>
                </View>
              </View>
              
              <Text style={[styles.cardSubtitle, {
          color: colors.textSecondary
        }]}>ID: #{road.id}</Text>
              
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEditClick(road)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }]}>
                  <Edit2 size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(road.id)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }]}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>)}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder
        }]}>
            <Text style={[styles.modalTitle, {
            color: colors.text
          }]}>{editingId ? 'Edit Road' : 'Add New Road'}</Text>
            
            <Text style={[styles.label, {
            color: colors.textSecondary
          }]}>Road Name</Text>
            <TextInput style={[styles.input, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
            color: colors.text,
            borderColor: colors.surfaceBorder
          }]} value={newRoad.name} onChangeText={text => setNewRoad({
            ...newRoad,
            name: text
          })} placeholder="Enter road name" placeholderTextColor={colors.textMuted} />

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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
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
    marginBottom: 24
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8
  }
});