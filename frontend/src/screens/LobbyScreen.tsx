import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import type { Player } from '../types/session';
import { socket } from '../services/socket';
import { colors } from '../theme/colors';

type Props = StackScreenProps<RootStackParamList, 'Lobby'>;

type LobbyUpdatePayload = {
  sessionCode: string;
  players: Player[];
};

export default function LobbyScreen({ route, navigation }: Props) {
  const { sessionCode } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
          credentials: 'include',
        });
        if (!res.ok) {
          if (active) setError('Not authenticated. Please log in again.');
          return;
        }
        const data = (await res.json()) as { username: string };
        if (!active) return;

        socket.connect();

        socket.on('lobby:update', (payload: LobbyUpdatePayload) => {
          setPlayers(payload.players);
        });

        socket.on('error', (payload: { message: string }) => {
          if (active) setError(payload.message);
        });

        socket.emit('session:joinRoom', { sessionCode, playerName: data.username });
      } catch {
        if (active) setError('Could not connect to server.');
      }
    }

    init();

    return () => {
      active = false;
      socket.off('lobby:update');
      socket.off('error');
      socket.disconnect();
    };
  }, [sessionCode]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sessionCode}>{sessionCode}</Text>
        <Text style={styles.playerCount}>
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </Text>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>{item.name}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Waiting for players...</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  sessionCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 8,
  },
  playerCount: {
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  playerRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  playerName: {
    fontSize: 16,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.placeholder,
    fontSize: 16,
    marginTop: 32,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
