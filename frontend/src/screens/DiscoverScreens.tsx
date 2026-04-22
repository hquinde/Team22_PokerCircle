import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { BACKEND_URL } from '../config/api';
import { colors } from '../theme/colors';

type Props = StackScreenProps<RootStackParamList, 'Discover'>;

type PublicSession = {
  session_code: string;
  host_user_id: string;
  buy_in_amount: number;
  max_rebuys: number;
  privacy: 'public' | 'private';
  player_count: number;
};

export default function DiscoverScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/public`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Could not load public sessions');
      }

      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load public sessions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helperText}>Loading public sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={loadSessions}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.helperText}>No public sessions are open right now.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={sessions}
      keyExtractor={(item) => item.session_code}
      renderItem={({ item }) => (
        <View style={styles.sessionCard}>
          <Text style={styles.cardTitle}>Session {item.session_code}</Text>
          <Text style={styles.cardText}>Players: {item.player_count}</Text>
          <Text style={styles.cardText}>Buy-In: ${item.buy_in_amount}</Text>
          <Text style={styles.cardText}>
            Rebuys: {item.max_rebuys === 0 ? 'Unlimited' : `Max ${item.max_rebuys}`}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              navigation.navigate('JoinSession', { preFilledCode: item.session_code })
            }
          >
            <Text style={styles.primaryButtonText}>Join</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  helperText: {
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
