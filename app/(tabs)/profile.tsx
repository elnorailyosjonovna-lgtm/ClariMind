import { getCurrentUser, logoutUser } from '@/services/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a84ff" />
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
    backgroundColor: '#0F0F10',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: '#0F0F10',
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
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2A2A2C',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#A1A1A6',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF453A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  infoText: {
    color: '#A1A1A6',
    textAlign: 'center',
  },
});