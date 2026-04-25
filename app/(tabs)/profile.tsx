import { getCurrentUser, logoutUser } from '@/services/auth';
import { getNotes } from '@/services/notes';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface User {
  id: number;
  full_name: string;
  email: string;
  created_at?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');

      const userData = await getCurrentUser();
      setUser(userData);

      // Load notes for stats
      const notesData = await getNotes();
      setNotes(notesData);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logoutUser();
        router.replace('/auth/login');
        return;
      }

      const errorMsg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to load user info';

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      router.replace('/auth/login');
    } catch (err: any) {
      console.error('Logout error:', err);
      router.replace('/auth/login');
    }
  };

  const stats = useMemo(() => {
    if (!user || !notes.length) return null;

    const totalNotes = notes.length;
    const accountAge = user.created_at
      ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const notesThisMonth = notes.filter((note) => {
      const noteDate = new Date(note.created_at);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return noteDate >= monthAgo;
    }).length;

    return { totalNotes, accountAge, notesThisMonth };
  }, [user, notes]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.infoText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {user && (
          <>
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.full_name.charAt(0).toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{user.full_name}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user.email}</Text>
              </View>

              {user.created_at ? (
                <View style={styles.userInfo}>
                  <Text style={styles.label}>Member Since</Text>
                  <Text style={styles.value}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ) : null}
            </View>

            {stats && (
              <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Notes</Text>
                    <Text style={styles.statValue}>{stats.totalNotes}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>This Month</Text>
                    <Text style={styles.statValue}>{stats.notesThisMonth}</Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Account Age</Text>
                    <Text style={styles.statValue}>{stats.accountAge}d</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Avg Daily</Text>
                    <Text style={styles.statValue}>{stats.accountAge > 0 ? Math.round(stats.totalNotes / stats.accountAge) : 0}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        <Pressable
          style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: '#0B1020',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userCard: {
    backgroundColor: '#151B2F',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
    fontSize: 20,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#151B2F',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
});