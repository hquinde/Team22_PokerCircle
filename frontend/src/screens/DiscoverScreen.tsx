import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';
import { getPublicSessions } from '../api/api';
import type { PublicSessionInfo } from '../api/api';
import AvatarDisplay from '../components/AvatarDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Props = StackScreenProps<RootStackParamList, 'Discover'>;

function formatAmount(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DiscoverScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PublicSessionInfo[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicSessions();
      setSessions(data);
    } catch (err: any) {
      console.error('Discover load error:', err);
      setError('Could not load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Finding open tables..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Open Public Sessions</Text>
        </View>

        {error && <ErrorMessage message={error} onRetry={loadSessions} />}

        {!error && sessions.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No public tables found</Text>
            <Text style={styles.emptySubtext}>Try creating one or join via code!</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.sessionCode}
            contentContainerStyle={styles.listContent}
            onRefresh={loadSessions}
            refreshing={loading}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('JoinSession', { preFilledCode: item.sessionCode })}
              >
                <View style={styles.cardTop}>
                  <View style={styles.hostInfo}>
                    <AvatarDisplay avatarId={item.hostAvatar} size={32} />
                    <View>
                      <Text style={styles.hostName}>{item.hostUsername}'s Game</Text>
                      <Text style={styles.sessionCode}>{item.sessionCode}</Text>
                    </View>
                  </View>
                  <View style={styles.playerCountBadge}>
                    <Text style={styles.playerCountText}>{item.playerCount} players</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>BUY-IN</Text>
                    <Text style={styles.settingValue}>
                      {item.buyInAmount > 0 ? formatAmount(item.buyInAmount) : 'No limit'}
                    </Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>REBUYS</Text>
                    <Text style={styles.settingValue}>
                      {item.maxRebuys === 0 ? 'Unlimited' : `Max ${item.maxRebuys}`}
                    </Text>
                  </View>
                  <View style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Join →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    color: colors.placeholder,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.placeholder,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sessionCode: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  playerCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playerCountText: {
    color: colors.placeholder,
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  settingItem: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 9,
    color: colors.placeholder,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  settingValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinBtnText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.placeholder,
    fontSize: 14,
    textAlign: 'center',
  },
});
