import { AudioRecorder } from '@/components/audio-recorder';
import { getNotes } from '@/services/notes';
import React, { useEffect, useMemo, useState } from 'react';
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

  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const ideasThisWeek = notes.filter((note) => {
      const noteDate = new Date(note.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return noteDate >= sevenDaysAgo;
    }).length;
    return { totalNotes, ideasThisWeek };
  }, [notes]);

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.greeting}>Hi Elnora 👋</Text>
        <Text style={styles.heroSubtitle}>Capture and organize ideas instantly</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Notes</Text>
            <Text style={styles.statValue}>{stats.totalNotes}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ideas This Week</Text>
            <Text style={styles.statValue}>{stats.ideasThisWeek}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recorderCard}>
        <AudioRecorder hideHeader embedded />
      </View>

      <Text style={styles.sectionTitle}>Recent Notes</Text>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#3B82F6" />
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
    backgroundColor: '#0B1020',
    padding: 20,
  },
  heroCard: {
    backgroundColor: '#151B2F',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  recorderCard: {
    backgroundColor: '#151B2F',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  notesList: {
    marginBottom: 20,
  },
  notesListContent: {
    paddingBottom: 24,
  },
  noteCard: {
    backgroundColor: '#151B2F',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  noteDate: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 6,
  },
  noteLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
  },
});