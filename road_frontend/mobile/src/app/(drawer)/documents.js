import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Modal, TextInput, Alert, Linking } from 'react-native';
import { Plus, Edit2, Trash2, FileText, Download } from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { getAllDocuments, uploadDocument, updateDocument, deleteDocument } from '@/api/documents';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
export default function DocumentsScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    fileBase64: '',
    fileName: ''
  });
  const {
    user
  } = useContext(AuthContext);
  const isCitizen = user?.role === 'CITIZEN';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  useEffect(() => {
    fetchDocuments();
  }, []);
  const fetchDocuments = async () => {
    try {
      const data = await getAllDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        setNewDocument({
          ...newDocument,
          fileBase64: `data:application/pdf;base64,${base64}`,
          fileName: file.name
        });
      }
    } catch (err) {
      console.error('Failed to pick document', err);
    }
  };
  const handleSubmit = async () => {
    if (!newDocument.title) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!editingId && !newDocument.fileBase64) {
      Alert.alert('Error', 'File is required');
      return;
    }
    try {
      const payload = {
        title: newDocument.title,
        fileBase64: newDocument.fileBase64
      };
      if (editingId) {
        await updateDocument(editingId, payload);
      } else {
        await uploadDocument(payload);
      }
      setShowModal(false);
      setEditingId(null);
      setNewDocument({
        title: '',
        fileBase64: '',
        fileName: ''
      });
      fetchDocuments();
    } catch (error) {
      console.error('Failed to save document', error);
      Alert.alert('Error', error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save document');
    }
  };
  const handleEditClick = doc => {
    setNewDocument({
      title: doc.title || '',
      fileBase64: '',
      fileName: ''
    });
    setEditingId(doc.id);
    setShowModal(true);
  };
  const handleDelete = id => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this document?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteDocument(id);
          fetchDocuments();
        } catch (error) {
          console.error('Failed to delete document', error);
        }
      }
    }]);
  };
  const handleViewDocument = async url => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open document url', error);
      Alert.alert('Error', 'Could not open the document link.');
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
        <Text style={[styles.title, {
        color: colors.text
      }]}>Documents</Text>
        {!isCitizen && <TouchableOpacity style={[styles.addButton, {
        backgroundColor: colors.primary
      }]} onPress={() => {
        setEditingId(null);
        setNewDocument({
          title: '',
          fileBase64: '',
          fileName: ''
        });
        setShowModal(true);
      }}>
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Upload</Text>
          </TouchableOpacity>}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {documents.length === 0 ? <Text style={[styles.emptyText, {
        color: colors.textMuted
      }]}>No documents found.</Text> : documents.map(doc => <View key={doc.id} style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FileText size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, {
              color: colors.text
            }]}>{doc.title}</Text>
                </View>
              </View>
              
              <Text style={[styles.infoText, {
          color: colors.textSecondary
        }]}>
                Date: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </Text>
              <Text style={[styles.infoText, {
          color: colors.textMuted,
          marginTop: 4
        }]}>ID: #{doc.id}</Text>
              
              <View style={styles.actions}>
                {doc.fileUrl ? <TouchableOpacity onPress={() => handleViewDocument(doc.fileUrl)} style={[styles.actionBtn, {
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            marginRight: 'auto'
          }]}>
                    <Text style={{
              color: colors.success,
              fontWeight: 'bold'
            }}>View PDF</Text>
                  </TouchableOpacity> : null}

                {!isCitizen && <>
                    <TouchableOpacity onPress={() => handleEditClick(doc)} style={[styles.actionBtn, {
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]}>
                      <Edit2 size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(doc.id)} style={[styles.actionBtn, {
              backgroundColor: 'rgba(239, 68, 68, 0.1)'
            }]}>
                      <Trash2 size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </>}
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
            }]}>{editingId ? 'Edit Document' : 'Upload Document'}</Text>
              
              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>Document Title</Text>
              <TextInput style={[styles.input, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
              color: colors.text,
              borderColor: colors.surfaceBorder
            }]} value={newDocument.title} onChangeText={text => setNewDocument({
              ...newDocument,
              title: text
            })} placeholder="Title" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.label, {
              color: colors.textSecondary
            }]}>PDF File</Text>
              <TouchableOpacity style={[styles.filePicker, {
              borderColor: colors.surfaceBorder,
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc'
            }]} onPress={handleFilePick}>
                <Download size={24} color={colors.textMuted} />
                <Text style={{
                color: colors.textMuted,
                marginTop: 8
              }}>
                  {newDocument.fileName ? newDocument.fileName : 'Tap to select PDF file'}
                </Text>
              </TouchableOpacity>

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
                  }}>{editingId ? 'Save' : 'Upload'}</Text>
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
  filePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
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