import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { RootStackParamList, TabParamList } from '../../App';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  createSession,
  getPendingInvites,
  respondToInvite,
  getPendingFriendRequests,
  respondToFriendRequest,
  getActiveSession,
} from '../api/api';
import type { ActiveSessionInfo } from '../api/api';
import { socket } from '../services/socket';
import { BACKEND_URL } from '../config/api';
import { clearAuth } from '../services/authStorage';
import type { FriendRequest, SessionInvite } from '../types/invite';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const { theme, colorScheme } = useTheme();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [invites, setInvites] = useState<SessionInvite[]>([]);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [respondingToRequest, setRespondingToRequest] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBuyIn, setNewBuyIn] = useState('');
  const [newMaxRebuys, setNewMaxRebuys] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('private');

  const [username, setUsername] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);

  // TM22-146: active session rejoin
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);

  const userIdRef = useRef<string | null>(null);

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleUserConnect = () => {
      if (userIdRef.current) {
        socket.emit('user:joinRoom', userIdRef.current);
      }
    };

    const handleNewInvite = (invite: SessionInvite) => {
      setInvites((prev) => {
        if (prev.some((i) => i.id === invite.id)) return prev;
        return [invite, ...prev];
      });
    };

    // TM22-146: if the active session ends while the user is on Home,
    // dismiss the banner automatically.
    const handleGameComplete = (payload: { sessionCode: string }) => {
      setActiveSession((prev) => {
        if (prev?.sessionCode === payload.sessionCode) return null;
        return prev;
      });
    };

    socket.on('connect', handleUserConnect);
    socket.on('user:invite', handleNewInvite);
    socket.on('game:complete', handleGameComplete);

    return () => {
      socket.off('connect', handleUserConnect);
      socket.off('user:invite', handleNewInvite);
      socket.off('game:complete', handleGameComplete);
    };
  }, []);

  // ── Initial load + focus refresh ─────────────────────────────────────────
  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHomeData(false);
    });
    return unsubscribe;
  }, [navigation]);

  // ── Data loading ─────────────────────────────────────────────────────────
  async function loadCurrentUser(): Promise<string> {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Could not load current user');
    }

    const data = (await res.json()) as { userID: string; username: string };
    userIdRef.current = data.userID;
    setUsername(data.username);

    socket.connect();
    if (socket.connected) {
      socket.emit('user:joinRoom', data.userID);
    }

    return data.userID;
  }

  async function loadInvites() {
    const pending = await getPendingInvites();
    setInvites(pending);
  }

  async function loadFriendRequests() {
    const requests = await getPendingFriendRequests();
    setFriendRequests(requests);
  }

  async function loadHomeData(showSpinner = true) {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      setScreenError(null);

      // Load user first so we have their ID for the active-session check
      const userId = await loadCurrentUser();

      // Run the remaining calls in parallel
      const [, , activeSess] = await Promise.all([
        loadInvites(),
        loadFriendRequests(),
        getActiveSession(userId).catch(() => null), // non-fatal
      ]);

      setActiveSession(activeSess?.sessionCode ? activeSess : null);
    } catch (err) {
      console.error('HomeScreen load error:', err);
      setScreenError('Could not connect — check your connection');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await clearAuth();
      socket.disconnect();
      userIdRef.current = null;
      setUsername(null);
      setActiveSession(null);
      setLoggingOut(false);
      
      const parent = navigation.getParent();
      if (parent) {
        parent.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as any }],
        });
      }
    }
  }

  async function handleRespondToRequest(
    request: FriendRequest,
    action: 'accept' | 'decline'
  ) {
    setRespondingToRequest(request.id);
    setRespondError(null);
    try {
      await respondToFriendRequest(request.id, action);
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error('Friend request response error:', err);
      setRespondError('Could not respond — check your connection and try again.');
    } finally {
      setRespondingToRequest(null);
    }
  }

  async function handleCreateSession() {
  setCreateError(null);
  setCreating(true);
  setShowCreateModal(false);

  try {
    const session = await createSession(
      newBuyIn ? parseFloat(newBuyIn) : 0,
      newMaxRebuys ? parseInt(newMaxRebuys, 10) : 0,
      newPrivacy
    );

    navigation.navigate('Lobby', { sessionCode: session.sessionCode });
  } catch (err: unknown) {
    setCreateError(err instanceof Error ? err.message : 'Could not create session');
  } finally {
    setCreating(false);
    setNewBuyIn('');
    setNewMaxRebuys('');
    setNewPrivacy('private');
    setCreateError(null);
    setCreating(true);
    setShowCreateModal(false);
    try {
      const session = await createSession(
        newBuyIn ? parseFloat(newBuyIn) : 0,
        newMaxRebuys ? parseInt(newMaxRebuys, 10) : 0,
        newPrivacy
      );
      navigation.navigate('Lobby', { sessionCode: session.sessionCode });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Could not create session');
    } finally {
      setCreating(false);
      setNewBuyIn('');
      setNewMaxRebuys('');
      setNewPrivacy('private');
    }
  }
}


  async function handleRespond(invite: SessionInvite, action: 'accept' | 'decline') {
    setRespondingTo(invite.id);
    setRespondError(null);
    try {
      await respondToInvite(invite.id, action);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      if (action === 'accept') {
        navigation.navigate('Lobby', { sessionCode: invite.sessionCode });
      }
    } catch (err: unknown) {
      console.error('Invite response error:', err);
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410) {
        setRespondError('That session has already started.');
        setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      } else {
        setRespondError(
          err instanceof Error
            ? err.message
            : 'Could not respond to invite — check your connection'
        );
      }
    } finally {
      setRespondingTo(null);
    }
  }

  // TM22-146: Navigate back into the active session and re-establish socket
  function handleRejoinSession() {
    if (!activeSession?.sessionCode) return;
    navigation.navigate('Game', {
      sessionCode: activeSession.sessionCode,
      buyInAmount: activeSession.buyInAmount ?? 0,
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingSpinner message="Loading home..." />;
  }

  if (screenError) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={screenError} onRetry={() => loadHomeData()} />
      </View>
    );
  }

  const headerContent = (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        <View style={styles.userSection}>
          <Text style={styles.title}>PokerCircle</Text>
          {username !== null && (
            <Text style={styles.usernameText}>{username}</Text>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              (pressed || loggingOut) && styles.logoutButtonPressed,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color={colors.placeholder} size="small" />
            ) : (
              <Text style={styles.logoutText}>Log Out</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── TM22-146: Active Session Rejoin Banner ── */}
      {activeSession?.sessionCode != null && (
        <Pressable
          style={({ pressed }) => [
            styles.rejoinBanner(theme),
            pressed && styles.rejoinBannerPressed,
          ]}
          onPress={handleRejoinSession}
        >
          <View style={styles.rejoinBannerLeft}>
            <View style={styles.rejoinPulseDot(theme)} />
            <View>
              <Text style={styles.rejoinBannerLabel(theme)}>SESSION IN PROGRESS</Text>
              <Text style={styles.rejoinBannerCode(theme)}>{activeSession.sessionCode}</Text>
            </View>
          </View>
          <Text style={styles.rejoinBannerCta(theme)}>Rejoin →</Text>
        </Pressable>
      )}

      {friendRequests.length > 0 && (
        <View style={styles.inviteSection}>
          <Text style={styles.inviteSectionTitle}>Friend Requests</Text>
          {friendRequests.map((request) => {
            const isResponding = respondingToRequest === request.id;
            return (
              <View key={request.id} style={styles.inviteRow}>
                <Text style={styles.inviteFrom}>{request.requesterUsername}</Text>
                <View style={styles.inviteActions}>
                  <Pressable
                    style={[styles.acceptButton, isResponding && styles.actionDisabled]}
                    onPress={() => handleRespondToRequest(request, 'accept')}
                    disabled={isResponding}
                  >
                    {isResponding ? (
                      <ActivityIndicator color={colors.textOnPrimary} size="small" />
                    ) : (
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.declineButton, isResponding && styles.actionDisabled]}
                    onPress={() => handleRespondToRequest(request, 'decline')}
                    disabled={isResponding}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {invites.length > 0 && (
        <View style={styles.inviteSection}>
          <Text style={styles.inviteSectionTitle}>Session Invites</Text>
        </View>
      )}

      {respondError !== null && <ErrorMessage message={respondError} />}
      {createError !== null && (
        <ErrorMessage message={createError} onRetry={handleCreateSession} />
      )}
    </View>
  );

  const footerContent = (
    <View style={styles.buttonContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          (pressed || creating) && styles.buttonPressed,
        ]}
        onPress={() => setShowCreateModal(true)}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>Create Session</Text>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('Discover')}
      >
        <Text style={styles.secondaryButtonText}>Discover Sessions</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('JoinSession')}
      >
        <Text style={styles.secondaryButtonText}>Join Session</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('Leaderboard')}
      >
        <Text style={styles.secondaryButtonText}>Leaderboard</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('FriendsList')}
      >
        <Text style={styles.secondaryButtonText}>My Friends</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.secondaryButtonText}>My Profile</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.listContent}
        data={invites}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={headerContent}
        ListFooterComponent={footerContent}
        renderItem={({ item }) => {
          const isResponding = respondingTo === item.id;
          return (
            <View style={styles.inviteRow}>
              <Text style={styles.inviteFrom}>From: {item.inviterUsername}</Text>
              <Text style={styles.inviteCode}>{item.sessionCode}</Text>
              <View style={styles.inviteActions}>
                <Pressable
                  style={[styles.acceptButton, isResponding && styles.actionDisabled]}
                  onPress={() => handleRespond(item, 'accept')}
                  disabled={isResponding}
                >
                  {isResponding ? (
                    <ActivityIndicator color={colors.textOnPrimary} size="small" />
                  ) : (
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.declineButton, isResponding && styles.actionDisabled]}
                  onPress={() => handleRespond(item, 'decline')}
                  disabled={isResponding}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Session Settings</Text>

              <Text style={styles.modalLabel}>Buy-In Amount ($)</Text>
              <TextInput
                style={styles.modalInput}
                value={newBuyIn}
                onChangeText={setNewBuyIn}
                keyboardType="numeric"
                placeholder="0 = no limit"
                placeholderTextColor={colors.placeholder}
              />

              <Text style={styles.modalLabel}>Max Rebuys</Text>
<TextInput
  style={styles.modalInput}
  value={newMaxRebuys}
  onChangeText={setNewMaxRebuys}
  keyboardType="numeric"
  placeholder="0 = unlimited"
  placeholderTextColor={colors.placeholder}
/>

<Text style={styles.modalLabel}>Session Privacy</Text>

<View style={styles.privacyRow}>
  <Pressable
    style={[
      styles.privacyOption,
      newPrivacy === 'private' && styles.privacyOptionActive,
    ]}
    onPress={() => setNewPrivacy('private')}
  >
    <Text
      style={[
        styles.privacyOptionText,
        newPrivacy === 'private' && styles.privacyOptionTextActive,
      ]}
    >
      Private
    </Text>
  </Pressable>

  <Pressable
    style={[
      styles.privacyOption,
      { marginRight: 0 },
      newPrivacy === 'public' && styles.privacyOptionActive,
    ]}
    onPress={() => setNewPrivacy('public')}
  >
    <Text
      style={[
        styles.privacyOptionText,
        newPrivacy === 'public' && styles.privacyOptionTextActive,
      ]}
    >
      Public
    </Text>
  </Pressable>
</View>

<Pressable
  style={[styles.primaryButton, { marginBottom: 10 }]}
  onPress={handleCreateSession}
  disabled={creating}
>
  {creating ? (
    <ActivityIndicator color={colors.textOnPrimary} />
  ) : (
    <Text style={styles.primaryButtonText}>Create</Text>
  )}
</Pressable>
              <TextInput
                style={styles.modalInput}
                value={newMaxRebuys}
                onChangeText={setNewMaxRebuys}
                keyboardType="numeric"
                placeholder="0 = unlimited"
                placeholderTextColor={colors.placeholder}
              />

              <Text style={styles.modalLabel}>Visibility</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    newPrivacy === 'private' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setNewPrivacy('private')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      newPrivacy === 'private' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Private
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    newPrivacy === 'public' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setNewPrivacy('public')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      newPrivacy === 'public' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Public
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.primaryButton, { marginBottom: 10 }]}
                onPress={handleCreateSession}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Create</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    color: colors.placeholder,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },

  privacyRow: {
  flexDirection: 'row',
  marginBottom: 16,
},

privacyOption: {
  flex: 1,
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.inputBorder,
  borderRadius: 8,
  paddingVertical: 12,
  alignItems: 'center',
  marginRight: 10,
},

privacyOptionActive: {
  backgroundColor: colors.primary,
  borderColor: colors.primary,
},

privacyOptionText: {
  color: colors.text,
  fontSize: 14,
  fontWeight: '600',
},

privacyOptionTextActive: {
  color: colors.textOnPrimary,
},
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.placeholder,
  },
  toggleBtnTextActive: {
    color: colors.textOnPrimary,
  },

  header: {
    alignItems: 'center',
    paddingBottom: 8,
    width: '100%',
  },
  profileRow: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  userSection: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 42,
    letterSpacing: 3,
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  usernameText: {
    color: colors.placeholder,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.disabled,
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  logoutText: {
    color: colors.placeholder,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── TM22-146: Rejoin banner ─────────────────────────────────────────────
  rejoinBanner: (theme: any) => ({
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  }),
  rejoinBannerPressed: {
    opacity: 0.8,
  },
  rejoinBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rejoinPulseDot: (theme: any) => ({
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.accent,
  }),
  rejoinBannerLabel: (theme: any) => ({
    fontSize: 9,
    fontWeight: '800',
    color: theme.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  }),
  rejoinBannerCode: (theme: any) => ({
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: 4,
  }),
  rejoinBannerCta: (theme: any) => ({
    fontSize: 14,
    fontWeight: '700',
    color: theme.accent,
  }),

  inviteSection: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 8,
  },
  inviteSectionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  inviteRow: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 12,
    marginBottom: 8,
  },
  inviteFrom: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 4,
  },
  inviteCode: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 10,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  declineButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.disabled,
  },
  acceptButtonText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  declineButtonText: {
    color: colors.placeholder,
    fontSize: 13,
  },
  actionDisabled: {
    opacity: 0.5,
  },

  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 14,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

});