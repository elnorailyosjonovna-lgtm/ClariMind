import { logoutUser } from '@/services/auth';
import { getNotes } from '@/services/notes';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Button,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotes = async () => {
    try {
      setError('');

      const data = await getNotes();
      setNotes(data);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
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

      <View style={styles.buttonWrap}>
        <Button title="Refresh" onPress={loadNotes} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.infoText}>No backend notes found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
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
          </View>
        )}
        contentContainerStyle={notes.length === 0 ? styles.emptyList : undefined}
      />
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
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});