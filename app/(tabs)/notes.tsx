import { logoutUser } from '@/services/auth';
import { deleteNote, getNotes, updateNote } from '@/services/notes';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

interface NoteItem {
  id: number;
  transcript: string;
  structured_data: string | null;
  created_at: string;
}

export default function NotesScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [editedStructuredData, setEditedStructuredData] = useState('');

  const loadNotes = async () => {
    try {
      setError('');

      const data = await getNotes();
      setNotes(data);
      applySearchFilter(data, searchQuery);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logoutUser();
        router.replace('/auth/login');
        return;
      }

      setError(
        err?.response?.data
          ? JSON.stringify(err.response.data, null, 2)
          : err?.message || 'Failed to load notes'
      );
    } finally {
      setLoading(false);
    }
  };

  const applySearchFilter = (allNotes: NoteItem[], query: string) => {
    if (!query.trim()) {
      setFilteredNotes(allNotes);
      return;
    }

    const lower = query.toLowerCase();

    const filtered = allNotes.filter((note) => {
      const transcriptMatch = note.transcript?.toLowerCase().includes(lower);
      const structuredMatch = note.structured_data?.toLowerCase().includes(lower);
      return transcriptMatch || structuredMatch;
    });

    setFilteredNotes(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applySearchFilter(notes, text);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const handleDelete = (noteId: number) => {
    Alert.alert(
      'Delete note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(noteId);
              await deleteNote(noteId);
              await loadNotes();
            } catch (err: any) {
              setError(
                err?.response?.data
                  ? JSON.stringify(err.response.data, null, 2)
                  : err?.message || 'Failed to delete note'
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const openDetailsModal = (note: NoteItem) => {
    setSelectedNote(note);
    setDetailModalVisible(true);
  };

  const openEditModal = (note: NoteItem) => {
    setSelectedNote(note);
    setEditedStructuredData(note.structured_data || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedNote) return;

    try {
      setSavingEdit(true);
      setError('');

      await updateNote(selectedNote.id, editedStructuredData);
      setEditModalVisible(false);
      setSelectedNote(null);
      setEditedStructuredData('');
      await loadNotes();
    } catch (err: any) {
      setError(
        err?.response?.data
          ? JSON.stringify(err.response.data, null, 2)
          : err?.message || 'Failed to update note'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.infoText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cloud Notes</Text>
        <Text style={styles.subtitle}>Your saved notes</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search notes..."
        placeholderTextColor="#A1A1A6"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.infoText}>No notes yet. Start by recording your first idea.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => openDetailsModal(item)}
          >
            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>

            <Text style={styles.label}>Transcript</Text>
            <Text style={styles.text} numberOfLines={3}>
              {item.transcript}
            </Text>

            <Text style={styles.label}>Structured</Text>
            <Text style={styles.text} numberOfLines={3}>
              {item.structured_data || 'No structured data'}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.deleteButton,
                  deletingId === item.id && styles.deleteButtonDisabled,
                ]}
                onPress={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
              >
                <Text style={styles.deleteButtonText}>
                  {deletingId === item.id ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        contentContainerStyle={filteredNotes.length === 0 ? styles.emptyList : undefined}
      />

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Structured Note</Text>

            <TextInput
              style={styles.modalInput}
              multiline
              placeholder="Edit structured note..."
              placeholderTextColor="#A1A1A6"
              value={editedStructuredData}
              onChangeText={setEditedStructuredData}
              textAlignVertical="top"
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={savingEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  savingEdit && styles.deleteButtonDisabled,
                ]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                <Text style={styles.saveButtonText}>
                  {savingEdit ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Note Details</Text>

            <Text style={styles.label}>Transcript</Text>
            <Text style={styles.modalText}>{selectedNote?.transcript}</Text>

            <Text style={[styles.label, styles.modalSectionLabel]}>Structured</Text>
            <Text style={styles.modalText}>
              {selectedNote?.structured_data || 'No structured data'}
            </Text>

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F10',
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#0F0F10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#A1A1A6',
    fontSize: 16,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2C',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  buttonWrap: {
    marginBottom: 20,
  },
  infoText: {
    color: '#A1A1A6',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF453A',
    marginBottom: 12,
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  card: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  time: {
    color: '#A1A1A6',
    fontSize: 12,
    marginBottom: 12,
  },
  label: {
    color: '#2F80ED',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
  },
  text: {
    color: '#FFFFFF',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2F80ED',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF453A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cardPressed: {
    backgroundColor: '#232326',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  modalSectionLabel: {
    marginTop: 16,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0F0F10',
    color: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2C',
    padding: 14,
    minHeight: 160,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2F80ED',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});