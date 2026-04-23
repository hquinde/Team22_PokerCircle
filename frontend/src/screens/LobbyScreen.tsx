import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { socket } from '../services/socket';
import { getSession } from '../api/api';
import { useTheme } from '../theme/ThemeContext';
import { BACKEND_URL } from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AvatarDisplay from '../components/AvatarDisplay';

type Props = StackScreenProps<RootStackParamList, 'Lobby'>;

type LobbyPlayer = {
  playerId: string;
  name: string;
  isReady: boolean;
  avatar?: string | null;
};

type LobbyUpdatePayload = {
  sessionCode: string;
  players: LobbyPlayer[];
};

type GameStartPayload = {
  sessionCode: string;
};

export default function LobbyScreen({ route, navigation }: Props) {
  const { sessionCode } = route.params;
  const { theme, colorScheme } = useTheme();
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(0);
  const [maxRebuys, setMaxRebuys] = useState(0);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const previousPlayersRef = useRef<LobbyPlayer[]>([]);
  const resolvedPlayerNameRef = useRef('');
  const resolvedAvatarRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let active = true;

    const handleLobbyUpdate = (payload: LobbyUpdatePayload) => {
      if (!active) return;
      const previousPlayers = previousPlayersRef.current;
      const currentPlayers = payload.players;

      if (previousPlayers.length === 0 && currentPlayers.length > 0) {
        setJoinMessage(`Joined session ${payload.sessionCode}`);
        setStatusMessage(null);
      } else if (previousPlayers.length < currentPlayers.length) {
        setStatusMessage('A player joined the lobby.');
      } else if (previousPlayers.length > currentPlayers.length) {
        setStatusMessage('A player left the lobby.');
      }

      previousPlayersRef.current = currentPlayers;
      setPlayers(currentPlayers);
      setIsJoining(false);
      setLoading(false);
    };

    const handleGameStart = (payload: GameStartPayload) => {
      if (!active) return;
      navigation.replace('Game', { sessionCode: payload.sessionCode, buyInAmount });
    };

    const handleSocketError = (payload: { message: string }) => {
      if (!active) return;
      setError(payload.message);
      setIsJoining(false);
      setLoading(false);
    };

    const handleConnectError = (_err: unknown) => {
      if (!active) return;
      setError('Could not connect — check your connection');
      setIsJoining(false);
      setLoading(false);
    };

    const handleReconnect = () => {
      if (!active || !resolvedPlayerNameRef.current) return;
      setStatusMessage('Reconnected to lobby.');
      socket.emit('session:joinRoom', {
        sessionCode,
        playerName: resolvedPlayerNameRef.current,
        avatar: resolvedAvatarRef.current,
      });
    };

    const handleConnect = () => {
      if (!active || !resolvedPlayerNameRef.current) return;
      socket.emit('session:joinRoom', {
        sessionCode,
        playerName: resolvedPlayerNameRef.current,
        avatar: resolvedAvatarRef.current,
      });
    };

    const handlePlayerRemoved = (payload: {
      sessionCode: string;
      removedDisplayName: string;
    }) => {
      if (!active || payload.sessionCode !== sessionCode) return;

      const removedName = payload.removedDisplayName.trim().toLowerCase();
      const myName = resolvedPlayerNameRef.current.trim().toLowerCase();

      if (removedName === myName) {
        Alert.alert('Left Session', 'You are no longer in this lobby.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    };

    async function init() {
      try {
        setLoading(true);
        setError(null);

        const authRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (!authRes.ok) {
          if (active) {
            setError('Not authenticated. Please log in again.');
            setLoading(false);
          }
          return;
        }

        const authData = (await authRes.json()) as {
          userID: string;
          username: string;
          avatar?: string | null;
        };
        const myUserId = authData.userID;
        const playerName = authData.username;

        if (!active) return;
        resolvedPlayerNameRef.current = playerName;
        resolvedAvatarRef.current = authData.avatar ?? null;

        try {
          const joinRes = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ displayName: playerName }),
          });

          if (!joinRes.ok) {
            console.error('Lobby join request failed');
          }
        } catch (err) {
          console.error('Lobby join request error:', err);
        }

        try {
          const session = await getSession(sessionCode);
          if (active) {
            setIsHost(session.hostUserId === myUserId);
            setBuyInAmount(session.buyInAmount ?? 0);
            setMaxRebuys(session.maxRebuys ?? 0);
            setPrivacy(session.privacy ?? 'private');
          }
        } catch (err) {
          console.error('LobbyScreen: Error fetching session:', err);
        }

        socket.on('lobby:update', handleLobbyUpdate);
        socket.on('game:start', handleGameStart);
        socket.on('player:removed', handlePlayerRemoved);
        socket.on('error', handleSocketError);
        socket.on('reconnect', handleReconnect);
        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);

        socket.connect();
        if (socket.connected) {
          socket.emit('session:joinRoom', {
            sessionCode,
            playerName: resolvedPlayerNameRef.current,
            avatar: resolvedAvatarRef.current,
          });
        }
      } catch (err) {
        console.error('Lobby init error:', err);
        if (active) {
          setError('Could not connect — check your connection');
          setIsJoining(false);
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      active = false;
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('game:start', handleGameStart);
      socket.off('player:removed', handlePlayerRemoved);
      socket.off('error', handleSocketError);
      socket.off('reconnect', handleReconnect);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [sessionCode, navigation, buyInAmount]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!startError) return;
    const timer = setTimeout(() => setStartError(null), 4000);
    return () => clearTimeout(timer);
  }, [startError]);

  async function handleReadyToggle() {
    const myPlayerName = resolvedPlayerNameRef.current;
    if (!myPlayerName) return;

    setError(null);
    const myIsReady = players.find((p) => p.name === myPlayerName)?.isReady ?? false;
    const nextReadyState = !myIsReady;

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: myPlayerName,
          isReady: nextReadyState,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to update ready status.');
      }
    } catch (err) {
      console.error('Ready toggle error:', err);
      setError('Could not connect — check your connection');
    }
  }

  const handleStartGame = async () => {
    setIsStarting(true);
    setStartError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStartError(data.error ?? 'Failed to start game.');
      }
    } catch (err) {
      console.error('Start game error:', err);
      setStartError('Could not connect — check your connection');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveSession = async () => {
    const myPlayerName = resolvedPlayerNameRef.current?.trim();
    if (!myPlayerName || isLeaving) return;

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to leave this session?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Leave Session',
              'Are you sure you want to leave this session?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Leave', style: 'destructive', onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmed) return;

    try {
      setIsLeaving(true);

      const res = await fetch(
        `${BACKEND_URL}/api/sessions/${sessionCode}/players/${encodeURIComponent(myPlayerName)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to leave session');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err) {
      console.error('Leave session error:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Could not leave session'
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRetry = () => {
    previousPlayersRef.current = [];
    setPlayers([]);
    setError(null);
    setStartError(null);
    setJoinMessage(null);
    setStatusMessage(null);
    setIsJoining(true);
    setLoading(true);

    socket.disconnect();
    socket.connect();
  };

  if (loading) {
    return <LoadingSpinner message="Joining lobby..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.errorContent}>
          <ErrorMessage message={error} onRetry={handleRetry} />
          <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.buttonText, { color: theme.textOnPrimary }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const allReady = players.length >= 2 && players.every((p) => p.isReady);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={theme.background} />
      <View style={styles.header}>
        <Text style={[styles.sessionCode, { color: theme.primary }]}>{sessionCode}</Text>
        <Text style={[styles.playerCount, { color: theme.text }]}>
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </Text>
      </View>

      {(buyInAmount > 0 || maxRebuys > 0) && (
        <View style={[styles.rulesCard, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <View style={styles.privacyBadgeRow}>
            <View
              style={[
                styles.privacyBadge,
                privacy === 'public'
                  ? { borderColor: theme.accent, backgroundColor: `${theme.accent}1A` }
                  : { borderColor: theme.placeholder, backgroundColor: theme.surface },
              ]}
            >
              <Text style={[styles.privacyBadgeText, { color: theme.text }]}>{privacy.toUpperCase()}</Text>
            </View>
          </View>
          {buyInAmount > 0 && (
            <Text style={[styles.ruleText, { color: theme.text }]}>Buy-in: ${buyInAmount}</Text>
          )}
          <Text style={[styles.ruleText, { color: theme.text }]}>
            Rebuys: {maxRebuys === 0 ? 'Unlimited' : `Max ${maxRebuys}`}
          </Text>
        </View>
      )}

      {isJoining && (
        <View style={[styles.infoBox, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Text style={[styles.infoText, { color: theme.text }]}>Joining lobby...</Text>
        </View>
      )}

      {joinMessage && !isJoining && (
        <View style={[styles.successBox, { backgroundColor: theme.inputBackground, borderColor: theme.primary }]}>
          <Text style={[styles.successText, { color: theme.primary }]}>{joinMessage}</Text>
        </View>
      )}

      {statusMessage && !isJoining && (
        <View style={[styles.statusBox, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Text style={[styles.statusText, { color: theme.text }]}>{statusMessage}</Text>
        </View>
      )}

      {startError && <ErrorMessage message={startError} onRetry={handleStartGame} />}

      <FlatList
        data={players}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item, index }) => {
          const isMe = item.name === resolvedPlayerNameRef.current;

          return (
            <View style={[styles.playerRow, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <View style={styles.playerLeft}>
                <AvatarDisplay avatarId={item.avatar} size={36} />
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.playerLabel, { color: theme.placeholder }]}>Player {index + 1}</Text>
                </View>
              </View>

              {isMe ? (
                <Pressable
                  onPress={handleReadyToggle}
                  style={[
                    styles.readyButton,
                    item.isReady && { borderColor: theme.primary, backgroundColor: theme.primary },
                    !item.isReady && { borderColor: theme.placeholder },
                  ]}
                >
                  <Text
                    style={[
                      styles.readyButtonText,
                      item.isReady && { color: theme.textOnPrimary },
                      !item.isReady && { color: theme.placeholder },
                    ]}
                  >
                    {item.isReady ? 'Not Ready' : 'Ready'}
                  </Text>
                </Pressable>
              ) : (
                <Text style={item.isReady ? { fontSize: 12, fontWeight: '600', color: theme.primary } : { fontSize: 12, fontWeight: '600', color: theme.placeholder }}>
                  {item.isReady ? 'Ready' : 'Not Ready'}
                </Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Lobby is empty</Text>
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>Waiting for players to join...</Text>
          </View>
        }
      />

      {isHost && (
        <View style={styles.startButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.inviteButton,
              { borderColor: theme.primary },
              pressed && styles.inviteButtonPressed,
            ]}
            onPress={() => navigation.navigate('InviteFriends', { sessionCode })}
          >
            <Text style={[styles.inviteButtonText, { color: theme.text }]}>Invite Friends</Text>
          </Pressable>

          {!allReady && (
            <Text style={[styles.waitingText, { color: theme.placeholder }]}>
              {players.length < 2
                ? 'Waiting for at least 2 players...'
                : 'Waiting for all players to ready up...'}
            </Text>
          )}

          <Pressable
            style={[
              styles.startButton,
              { backgroundColor: theme.primary },
              (!allReady || isStarting) && styles.startButtonDisabled,
            ]}
            onPress={handleStartGame}
            disabled={!allReady || isStarting}
          >
            <Text style={[styles.startButtonText, { color: theme.textOnPrimary }]}>
              {isStarting ? 'Starting...' : 'Start Game'}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.leaveButtonContainer}>
        <Pressable
          style={[
            styles.leaveButton,
            { backgroundColor: theme.primaryDark },
            isLeaving && styles.leaveButtonDisabled,
          ]}
          onPress={handleLeaveSession}
          disabled={isLeaving}
        >
          <Text style={[styles.leaveButtonText, { color: theme.textOnPrimary }]}>
            {isLeaving ? 'Leaving...' : 'Leave Session'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  sessionCode: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  playerCount: { fontSize: 16, marginTop: 8 },

  infoBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: { fontSize: 14, textAlign: 'center' },

  successBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },

  statusBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 14, textAlign: 'center' },

  listContent: { paddingHorizontal: 16, flexGrow: 1 },

  playerRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: { fontSize: 16, fontWeight: '600' },
  playerLabel: { marginTop: 4, fontSize: 12 },

  readyButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  readyButtonActive: {
  },
  readyButtonText: { fontSize: 12, fontWeight: '600' },
  readyButtonTextActive: { },

  emptyState: { marginTop: 48, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 16 },

  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },

  startButtonContainer: { padding: 16, paddingBottom: 12 },
  waitingText: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 8,
  },
  startButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.4 },
  startButtonText: { fontSize: 16, fontWeight: '700' },

  inviteButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteButtonPressed: { opacity: 0.85 },
  inviteButtonText: { fontSize: 15, fontWeight: '600' },

  playerLeft: { flexDirection: 'row', alignItems: 'center' },
  playerInfo: { marginLeft: 10 },

  rulesCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  ruleText: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 2,
  },
  privacyBadgeRow: {
    marginBottom: 8,
  },
  privacyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  leaveButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  leaveButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    opacity: 0.6,
  },
  leaveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
