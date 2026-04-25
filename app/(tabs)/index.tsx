import { AudioRecorder } from '@/components/audio-recorder';
import { getNotes } from '@/services/notes';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

interface NoteItem {
  id: number;
  transcript: string;
  structured_data: string | null;
  created_at: string;
}

export default function HomeScreen() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecentNotes();
  }, []);

  const loadRecentNotes = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await getNotes();
      const sorted = [...data].sort(
        (a: NoteItem, b: NoteItem) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotes(sorted.slice(0, 3));
    } catch (err) {
      console.warn('Failed to load recent notes', err);
      setError('Unable to load recent notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ClariMind</Text>
        <Text style={styles.subtitle}>Capture your ideas instantly</Text>
      </View>

      <View style={styles.recorderWrapper}>
        <AudioRecorder hideHeader embedded />
      </View>

      <Text style={styles.sectionTitle}>Recent Notes</Text>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#0a84ff" />
          <Text style={styles.infoText}>Loading recent notes...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : notes.length === 0 ? (
        <Text style={styles.emptyText}>No notes yet. Record your first idea.</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          style={styles.notesList}
          contentContainerStyle={styles.notesListContent}
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <Text style={styles.noteDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.noteLabel}>Transcript</Text>
              <Text style={styles.noteText} numberOfLines={2}>
                {item.transcript}
              </Text>
              <Text style={styles.noteLabel}>Structured</Text>
              <Text style={styles.noteText} numberOfLines={2}>
                {item.structured_data || 'No structured data'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#a1a1b8',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#cbd5ff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  notesList: {
    marginBottom: 20,
  },
  notesListContent: {
    paddingBottom: 12,
  },
  noteCard: {
    backgroundColor: '#12182f',
    borderColor: '#172146',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  noteDate: {
    color: '#8fa4f1',
    fontSize: 13,
    marginBottom: 6,
  },
  noteLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 16,
  },
  recorderWrapper: {
    marginBottom: 20,
  },
});