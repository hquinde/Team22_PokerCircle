import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import type { Player } from '../types/session';
import { socket } from '../services/socket';
import { colors } from '../theme/colors';
import { getSession } from '../api/api';

type Props = StackScreenProps<RootStackParamList, 'Lobby'>;

type LobbyUpdatePayload = {
  sessionCode: string;
  players: Player[];
};

const READY_GREEN = '#22C55E';

export default function LobbyScreen({ route, navigation }: Props) {
  const { sessionCode, devPlayerName } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerName, setMyPlayerName] = useState<string | null>(null);
  const [myIsReady, setMyIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        let playerName: string;
        let myUserId: string | null = null;

        if (devPlayerName !== undefined) {
          playerName = devPlayerName;
        } else {
          const res = await fetch('http://localhost:3000/api/auth/me', {
            credentials: 'include',
          });
          if (!res.ok) {
            if (active) setError('Not authenticated. Please log in again.');
            return;
          }
          const data = (await res.json()) as { userID: string; username: string };
          if (!active) return;
          playerName = data.username;
          myUserId = data.userID;
        }

        // Fetch session to determine host
        try {
          const session = await getSession(sessionCode);
          if (active && myUserId !== null) {
            setIsHost(session.hostUserId === myUserId);
          }
        } catch {
          // Non-fatal: host badge won't show but lobby still works
        }

        if (active) setMyPlayerName(playerName);

        socket.connect();

        socket.on('lobby:update', (payload: LobbyUpdatePayload) => {
          setPlayers(payload.players);
          const me = payload.players.find((p) => p.name === playerName);
          if (me) setMyIsReady(me.isReady);
        });

        socket.on('error', (payload: { message: string }) => {
          if (active) setError(payload.message);
        });

        socket.emit('session:joinRoom', { sessionCode, playerName });
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
  }, [sessionCode, devPlayerName]);

  async function handleReadyToggle() {
    if (!myPlayerName) return;
    const next = !myIsReady;
    try {
      const res = await fetch(
        `http://localhost:3000/api/sessions/${sessionCode}/ready`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: myPlayerName, isReady: next }),
        }
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to update ready status.');
      }
    } catch {
      setError('Could not reach server.');
    }
  }

  async function handleStartGame() {
    try {
      const res = await fetch(
        `http://localhost:3000/api/sessions/${sessionCode}/start`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to start game.');
      }
      // Navigation to game screen goes here in a future story
    } catch {
      setError('Could not reach server.');
    }
  }

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
        renderItem={({ item }) => {
          const isMe = item.name === myPlayerName;
          return (
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>{item.name}</Text>
              {isMe && isHost && (
                <Text style={styles.hostBadge}>HOST</Text>
              )}
              <View style={[styles.readyDot, item.isReady && styles.readyDotActive]} />
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Waiting for players...</Text>
        }
      />

      <View style={styles.footer}>
        {isHost && (
          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]}
            onPress={handleStartGame}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.readyButton, myIsReady && styles.readyButtonActive]}
          onPress={handleReadyToggle}
          disabled={myPlayerName === null}
        >
          <Text style={styles.readyButtonText}>
            {myIsReady ? 'Unready' : 'Ready'}
          </Text>
        </Pressable>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  hostBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginRight: 8,
  },
  readyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.disabled,
  },
  readyDotActive: {
    backgroundColor: READY_GREEN,
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
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 10,
  },
  startButton: {
    backgroundColor: READY_GREEN,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  readyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: READY_GREEN,
  },
  readyButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
