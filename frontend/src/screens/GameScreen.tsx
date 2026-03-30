import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import type { Player, Session } from '../types/session';
import { socket } from '../services/socket';
import { getSession, updatePlayerFinances, completeSession } from '../api/api';
import { colors } from '../theme/colors';
import { BACKEND_URL } from '../config/api';

type Props = StackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route, navigation }: Props) {
  const { sessionCode } = route.params;
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [me, setMe] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Input states
  const [buyInInput, setBuyInInput] = useState('0');
  const [rebuyAmount, setRebuyAmount] = useState('0');
  const [cashOutInput, setCashOutInput] = useState('0');
  const [showRebuyInput, setShowRebuyInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myDisplayNameRef = useRef('');

  useEffect(() => {
    let active = true;

    const handleUpdate = (payload: { sessionCode: string; players: Player[] }) => {
      if (!active) return;
      setPlayers(payload.players);
      const myPlayer = payload.players.find(p => p.displayName === myDisplayNameRef.current);
      if (myPlayer) {
        setMe(myPlayer);
        // Sync local inputs if not editing? Or just keep them.
        // For buy-in, we only set it once.
      }
    };

    const handleComplete = () => {
      if (!active) return;
      // Navigate to results/summary screen when it exists
      // For now, just go back or show a message
      Alert.alert('Session Ended', 'The host has ended the session.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    };

    async function init() {
      try {
        // 1. Get current user
        const authRes = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (!authRes.ok) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        const authData = await authRes.json();
        myDisplayNameRef.current = authData.username;

        // 2. Fetch session
        const sessionData = await getSession(sessionCode);
        if (!active) return;

        setSession(sessionData);
        setPlayers(sessionData.players);
        setIsHost(sessionData.hostUserId === authData.userID);

        const myPlayer = sessionData.players.find(p => p.displayName === authData.username);
        if (myPlayer) {
          setMe(myPlayer);
          setBuyInInput(String(myPlayer.buyIn || 0));
          setCashOutInput(String(myPlayer.cashOut || 0));
        }

        // 3. Setup socket
        socket.emit('session:joinRoom', { sessionCode, playerName: authData.username });
        socket.on('lobby:update', handleUpdate);
        socket.on('game:complete', handleComplete);

        setLoading(false);
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to initialize game');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
      socket.off('lobby:update', handleUpdate);
      socket.off('game:complete', handleComplete);
    };
  }, [sessionCode, navigation]);

  const validateNumeric = (val: string) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 0;
  };

  const handleUpdateBuyIn = async () => {
    if (!validateNumeric(buyInInput)) {
      Alert.alert('Invalid Input', 'Please enter a non-negative number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePlayerFinances(sessionCode, myDisplayNameRef.current, {
        buyIn: parseInt(buyInInput, 10),
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update buy-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRebuy = async () => {
    if (!validateNumeric(rebuyAmount) || parseInt(rebuyAmount, 10) === 0) {
      Alert.alert('Invalid Input', 'Please enter a positive number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const currentRebuy = me?.rebuyTotal || 0;
      await updatePlayerFinances(sessionCode, myDisplayNameRef.current, {
        rebuyTotal: currentRebuy + parseInt(rebuyAmount, 10),
      });
      setShowRebuyInput(false);
      setRebuyAmount('0');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add rebuy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCashOut = async () => {
    if (!validateNumeric(cashOutInput)) {
      Alert.alert('Invalid Input', 'Please enter a non-negative number.');
      return;
    }
    
    Alert.alert(
      'Confirm Cash Out',
      `Are you sure you want to cash out with ${cashOutInput}? You won't be able to edit this later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await updatePlayerFinances(sessionCode, myDisplayNameRef.current, {
                cashOut: parseInt(cashOutInput, 10),
                cashOutConfirmed: true,
              });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to submit cash-out');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleEndSession = async () => {
    const unconfirmed = players.filter(p => !p.cashOutConfirmed);
    if (unconfirmed.length > 0) {
      Alert.alert(
        'Cannot End Session',
        `The following players have not submitted their cash-out: ${unconfirmed.map(p => p.displayName).join(', ')}`
      );
      return;
    }

    Alert.alert(
      'End Session',
      'Are you sure you want to end the session for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await completeSession(sessionCode);
              // Navigation is handled by socket event
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to end session');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.statusText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Active Game</Text>
            <Text style={styles.code}>{sessionCode}</Text>
          </View>

          {/* Current Player Actions */}
          {me && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Finances</Text>
              
              <View style={styles.financeRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Buy-In</Text>
                  <TextInput
                    style={[styles.input, me.cashOutConfirmed && styles.disabledInput]}
                    value={buyInInput}
                    onChangeText={setBuyInInput}
                    keyboardType="numeric"
                    editable={!me.cashOutConfirmed}
                  />
                  {!me.cashOutConfirmed && (
                    <Pressable 
                      style={styles.smallButton} 
                      onPress={handleUpdateBuyIn}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.smallButtonText}>Update</Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Rebuys</Text>
                  <Text style={styles.financeValue}>{me.rebuyTotal}</Text>
                  {!me.cashOutConfirmed && (
                    <Pressable 
                      style={styles.smallButton} 
                      onPress={() => setShowRebuyInput(true)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.smallButtonText}>Add Rebuy</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {showRebuyInput && !me.cashOutConfirmed && (
                <View style={styles.rebuyInputContainer}>
                  <Text style={styles.label}>Rebuy Amount</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 8 }]}
                      value={rebuyAmount}
                      onChangeText={setRebuyAmount}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Pressable 
                      style={[styles.smallButton, { backgroundColor: colors.primary }]} 
                      onPress={handleAddRebuy}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.smallButtonText}>Confirm</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.smallButton, { backgroundColor: colors.placeholder, marginLeft: 8 }]} 
                      onPress={() => setShowRebuyInput(false)}
                    >
                      <Text style={styles.smallButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={[styles.section, { marginTop: 16 }]}>
                <Text style={styles.label}>Final Cash-Out</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }, me.cashOutConfirmed && styles.disabledInput]}
                    value={cashOutInput}
                    onChangeText={setCashOutInput}
                    keyboardType="numeric"
                    editable={!me.cashOutConfirmed}
                  />
                  {!me.cashOutConfirmed ? (
                    <Pressable 
                      style={[styles.button, { flex: 0.5 }]} 
                      onPress={handleSubmitCashOut}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.buttonText}>Submit</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedText}>Confirmed</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Player List Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player Summary</Text>
            {players.map((player) => (
              <View key={player.playerId} style={styles.playerCard}>
                <View style={styles.playerHeader}>
                  <Text style={styles.playerName}>{player.displayName}</Text>
                  {player.cashOutConfirmed && (
                    <Text style={styles.readyText}>✓ Done</Text>
                  )}
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Buy-In</Text>
                    <Text style={styles.statValue}>{player.buyIn}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Rebuys</Text>
                    <Text style={styles.statValue}>{player.rebuyTotal}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Cash-Out</Text>
                    <Text style={styles.statValue}>{player.cashOutConfirmed ? player.cashOut : '...'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Host Actions */}
          {isHost && (
            <View style={styles.hostSection}>
              <Pressable style={styles.endButton} onPress={handleEndSession}>
                <Text style={styles.endButtonText}>End Session</Text>
              </Pressable>
              <Text style={styles.hintText}>
                You can only end the session once everyone has submitted their cash-out.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  code: {
    fontSize: 18,
    color: colors.text,
    letterSpacing: 4,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.inputBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 0.48,
  },
  label: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#262626',
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: '#1a1a1a',
  },
  financeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  smallButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rebuyInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  confirmedBadge: {
    flex: 1,
    backgroundColor: '#1a3a1a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  confirmedText: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerCard: {
    backgroundColor: '#262626',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  readyText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.placeholder,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  hostSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  endButtonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 12,
    color: colors.placeholder,
    textAlign: 'center',
    marginTop: 12,
  },
  statusText: {
    color: colors.text,
    fontSize: 16,
  },
  errorText: {
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});