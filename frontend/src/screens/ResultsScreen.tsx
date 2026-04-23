import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { getSessionResults, submitRating } from '../api/api';
import type { PlayerResult, SettlementTransaction } from '../api/api';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { BACKEND_URL } from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Props = StackScreenProps<RootStackParamList, 'Results'>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RatablePlayer {
  userId: string;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Star selector sub-component
// ---------------------------------------------------------------------------

function StarSelector({
  value,
  onChange,
  disabled,
  themeColor,
}: {
  value: number | null;
  onChange: (stars: number) => void;
  disabled: boolean;
  themeColor: string;
}) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => !disabled && onChange(n)}
          style={({ pressed }) => [
            starStyles.star,
            pressed && !disabled && starStyles.starPressed,
          ]}
          disabled={disabled}
          accessibilityLabel={`Rate ${n} star${n !== 1 ? 's' : ''}`}
        >
          <Text
            style={[
              starStyles.starText,
              value !== null && n <= value
                ? starStyles.starFilled
                : { color: themeColor },
            ]}
          >
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    padding: 4,
  },
  starPressed: {
    opacity: 0.6,
  },
  starText: {
    fontSize: 28,
  },
  starFilled: {
    color: '#FFC107',
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ResultsScreen({ route, navigation }: Props) {
  const { sessionCode } = route.params;
  const { theme, colorScheme } = useTheme();

  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [transactions, setTransactions] = useState<SettlementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating state
  const [ratablePlayers, setRatablePlayers] = useState<RatablePlayer[]>([]);
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const [ratingsSubmitted, setRatingsSubmitted] = useState(false);
  const [ratingsSubmitting, setRatingsSubmitting] = useState(false);
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const myUserIdRef = useRef<string | null>(null);

  // ── Load results + identify ratable players ─────────────────────────────
  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current user and session results in parallel
      const [meRes, data] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' }),
        getSessionResults(sessionCode),
      ]);

      const sorted = [...data.playerResults].sort((a, b) => b.netResult - a.netResult);
      setPlayerResults(sorted);
      setTransactions(data.transactions);

      // Identify which players we can rate (all except self)
      // We need userIDs — fetch session players to match displayName → userId
      if (meRes.ok) {
        const me = (await meRes.json()) as { userID: string; username: string };
        myUserIdRef.current = me.userID;

        // Fetch session players list (has displayName, linked to users via username)
        const playersRes = await fetch(
          `${BACKEND_URL}/api/sessions/${sessionCode}/players`,
          { credentials: 'include' }
        );

        if (playersRes.ok) {
          const players = (await playersRes.json()) as Array<{
            displayName?: string;
            name?: string;
          }>;

          // For each non-self player, resolve their userId from the users table
          // via GET /api/users/:userId - we search by username using the friends
          // search endpoint since we just need userId↔username mapping
          const otherDisplayNames = players
            .map((p) => p.displayName ?? p.name ?? '')
            .filter((name) => name.trim() !== '' && name !== me.username);

          // Resolve display names → userIds by calling friends search for each
          // (we use the existing search endpoint — it returns userId + username)
          const resolved: RatablePlayer[] = [];
          await Promise.all(
            otherDisplayNames.map(async (displayName) => {
              try {
                const searchRes = await fetch(
                  `${BACKEND_URL}/api/friends/search?q=${encodeURIComponent(displayName)}`,
                  { credentials: 'include' }
                );
                if (searchRes.ok) {
                  const searchData = (await searchRes.json()) as {
                    users: Array<{ userId: string; username: string }>;
                  };
                  // Find exact username match (search is ILIKE so verify)
                  const match = searchData.users.find(
                    (u) => u.username.toLowerCase() === displayName.toLowerCase()
                  );
                  if (match) {
                    resolved.push({ userId: match.userId, displayName });
                  }
                }
              } catch {
                // Non-fatal — guest players without accounts just won't appear
              }
            })
          );

          setRatablePlayers(resolved);
          // Initialise all ratings to null (unset / skip)
          const initialRatings: Record<string, number | null> = {};
          for (const p of resolved) {
            initialRatings[p.userId] = null;
          }
          setRatings(initialRatings);
        }
      }
    } catch (err: unknown) {
      console.error('ResultsScreen load error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect — check your connection'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResults();
  }, [sessionCode]);

  // Block hardware back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleSetRating = (userId: string, stars: number) => {
    setRatings((prev) => ({ ...prev, [userId]: stars }));
  };

  const handleSubmitRatings = async () => {
    const toSubmit = ratablePlayers.filter(
      (p) => ratings[p.userId] !== null
    );

    // If nothing was rated, just skip
    if (toSubmit.length === 0) {
      const confirmed =
        Platform.OS === 'web'
          ? window.confirm("You haven't rated anyone. Skip ratings?")
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                'Skip Ratings?',
                "You haven't rated anyone. Skip ratings and return home?",
                [
                  { text: 'Go Back', style: 'cancel', onPress: () => resolve(false) },
                  { text: 'Skip', onPress: () => resolve(true) },
                ]
              );
            });
      if (confirmed) handleReturnHome();
      return;
    }

    setRatingsSubmitting(true);
    setRatingsError(null);

    const errors: string[] = [];

    await Promise.all(
      toSubmit.map(async (p) => {
        const stars = ratings[p.userId];
        if (stars === null) return;
        try {
          await submitRating(p.userId, sessionCode, stars);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          // Duplicate is fine — user may have already submitted
          if (!msg.toLowerCase().includes('already rated')) {
            errors.push(`${p.displayName}: ${msg}`);
          }
        }
      })
    );

    setRatingsSubmitting(false);

    if (errors.length > 0) {
      setRatingsError(`Some ratings failed:\n${errors.join('\n')}`);
    } else {
      setRatingsSubmitted(true);
      // Short delay so user sees the success state, then go home
      setTimeout(() => handleReturnHome(), 1200);
    }
  };

  // ── Payment helpers (unchanged from before) ──────────────────────────────

  const openUrlWithFallback = async (primaryUrl: string, fallbackUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(primaryUrl);
      if (supported) {
        await Linking.openURL(primaryUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch (err) {
      console.error('Payment link error:', err);
      Alert.alert('Error', 'Could not open payment link.');
    }
  };

  const handleVenmoPayment = async (to: string, amount: number) => {
    const note = encodeURIComponent(`PokerCircle payment for session ${sessionCode}`);
    const venmoAppUrl = `venmo://paycharge?txn=pay&amount=${amount.toFixed(2)}&note=${note}`;
    Alert.alert(
      'Open Venmo',
      `Recipient handle for ${to} is not saved yet, so Venmo will open and you can finish the payment manually.`
    );
    await openUrlWithFallback(venmoAppUrl, 'https://venmo.com/');
  };

  const handlePayPalPayment = async (to: string) => {
    Alert.alert(
      'Open PayPal',
      `PayPal.Me handle for ${to} is not saved yet, so PayPal will open and you can finish the payment manually.`
    );
    await openUrlWithFallback('paypal://', 'https://www.paypal.com/');
  };

  const handleCashAppPayment = async (to: string) => {
    Alert.alert(
      'Open Cash App',
      `Cash App handle for ${to} is not saved yet, so Cash App will open and you can finish the payment manually.`
    );
    await openUrlWithFallback('cashapp://', 'https://cash.app/');
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const styles = getStyles(theme);

  if (loading) {
    return <LoadingSpinner message="Calculating results..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ErrorMessage message={error} onRetry={loadResults} />
          <Pressable style={styles.doneButton} onPress={handleReturnHome}>
            <Text style={styles.doneButtonText}>Return to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.code}>{sessionCode}</Text>
        </View>

        {/* ── Net Results ── */}
        <Text style={styles.sectionLabel}>Net Results</Text>

        {playerResults.map((item) => {
          const isWinner = item.netResult > 0;
          const isLoser = item.netResult < 0;
          const sign = isWinner ? '+' : isLoser ? '-' : '';

          return (
            <View key={item.displayName} style={styles.resultRow}>
              <View style={styles.resultLeft}>
                <Text style={styles.medal}>
                  {isWinner ? '↑' : isLoser ? '↓' : '—'}
                </Text>
                <Text style={styles.playerName} numberOfLines={1}>
                  {item.displayName}
                </Text>
              </View>
              <Text
                style={[
                  styles.netAmount,
                  isWinner ? styles.positive : null,
                  isLoser ? styles.negative : null,
                ]}
              >
                {sign}${Math.abs(item.netResult).toFixed(2)}
              </Text>
            </View>
          );
        })}

        {/* ── Who Pays Who ── */}
        <Text style={styles.sectionLabelWithSpacing}>Who Pays Who</Text>

        {transactions.length === 0 ? (
          <View style={styles.evenBox}>
            <Text style={styles.evenText}>
              Everyone is even — no payments needed.
            </Text>
          </View>
        ) : (
          transactions.map((t, idx) => (
            <View key={idx} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionLabel}>Settlement</Text>
                <Text style={styles.transactionAmount}>
                  ${t.amount.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.transactionText}>
                <Text style={styles.fromName}>{t.from}</Text> pays{' '}
                <Text style={styles.toName}>{t.to}</Text>
              </Text>

              <View style={styles.paymentButtonsRow}>
                <Pressable
                  style={[styles.payButton, styles.venmoButton]}
                  onPress={() => handleVenmoPayment(t.to, t.amount)}
                >
                  <Text style={styles.payButtonText}>Venmo</Text>
                </Pressable>
                <Pressable
                  style={[styles.payButton, styles.paypalButton]}
                  onPress={() => handlePayPalPayment(t.to)}
                >
                  <Text style={styles.payButtonText}>PayPal</Text>
                </Pressable>
                <Pressable
                  style={[styles.payButton, styles.cashAppButton]}
                  onPress={() => handleCashAppPayment(t.to)}
                >
                  <Text style={styles.payButtonText}>Cash App</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* ── Rate Your Players ── */}
        {!ratingsSubmitted && ratablePlayers.length > 0 && (
          <View style={styles.ratingsCard}>
            <Text style={styles.ratingsTitle}>Rate Your Players</Text>
            <Text style={styles.ratingsSubtitle}>
              Optional — tap stars to rate, or leave blank to skip
            </Text>

            {ratablePlayers.map((player) => (
              <View key={player.userId} style={styles.ratingRow}>
                <Text style={styles.ratingName} numberOfLines={1}>
                  {player.displayName}
                </Text>
                <StarSelector
                  value={ratings[player.userId] ?? null}
                  onChange={(stars) => handleSetRating(player.userId, stars)}
                  disabled={ratingsSubmitting}
                  themeColor={theme.border}
                />
              </View>
            ))}

            {ratingsError !== null && (
              <Text style={styles.ratingsError}>{ratingsError}</Text>
            )}

            <Pressable
              style={[
                styles.submitRatingsButton,
                ratingsSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmitRatings}
              disabled={ratingsSubmitting}
            >
              {ratingsSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitRatingsText}>Submit Ratings</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.skipRatingsButton}
              onPress={handleReturnHome}
              disabled={ratingsSubmitting}
            >
              <Text style={styles.skipRatingsText}>Skip</Text>
            </Pressable>
          </View>
        )}

        {ratingsSubmitted && (
          <View style={styles.ratingsSuccessBox}>
            <Text style={styles.ratingsSuccessText}>
              ★ Ratings submitted — thanks!
            </Text>
          </View>
        )}

        {/* Hide Return Home if the ratings card is visible — ratings card
            has its own Skip button that goes home */}
        {(ratingsSubmitted || ratablePlayers.length === 0) && (
          <Pressable
            style={({ pressed }) => [
              styles.doneButton,
              pressed ? styles.doneButtonPressed : null,
            ]}
            onPress={handleReturnHome}
          >
            <Text style={styles.doneButtonText}>Return to Home</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  headerRow: {
    marginBottom: 24,
  },

  title: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.primaryDark,
    letterSpacing: 1,
  },

  code: {
    fontSize: 13,
    color: theme.placeholder,
    letterSpacing: 4,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.placeholder,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  sectionLabelWithSpacing: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.placeholder,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 10,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    gap: 12,
  },

  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  medal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.placeholder,
    marginRight: 10,
  },

  playerName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },

  netAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },

  positive: {
    color: '#4CAF50',
  },

  negative: {
    color: theme.primary,
  },

  evenBox: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    alignItems: 'center',
  },

  evenText: {
    color: theme.text,
    fontSize: 15,
    textAlign: 'center',
  },

  transactionCard: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },

  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },

  transactionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  transactionText: {
    color: theme.text,
    fontSize: 16,
    lineHeight: 22,
  },

  fromName: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  toName: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },

  transactionAmount: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
  },

  paymentButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  payButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },

  venmoButton: {
    backgroundColor: '#3D95CE',
  },

  paypalButton: {
    backgroundColor: '#003087',
  },

  cashAppButton: {
    backgroundColor: '#00C244',
  },

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Ratings section ────────────────────────────────────────────────────

  ratingsCard: {
    marginTop: 28,
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },

  ratingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  ratingsSubtitle: {
    fontSize: 12,
    color: theme.placeholder,
    marginBottom: 18,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  ratingName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },

  ratingsError: {
    color: '#EF5350',
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },

  submitRatingsButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },

  submitRatingsText: {
    color: theme.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  skipRatingsButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },

  skipRatingsText: {
    color: theme.placeholder,
    fontSize: 14,
  },

  ratingsSuccessBox: {
    marginTop: 24,
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
    alignItems: 'center',
  },

  ratingsSuccessText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '700',
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  // ── Done button ────────────────────────────────────────────────────────

  doneButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 10,
    paddingHorizontal: 24,
  },

  doneButtonPressed: {
    opacity: 0.85,
  },

  doneButtonText: {
    color: theme.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});