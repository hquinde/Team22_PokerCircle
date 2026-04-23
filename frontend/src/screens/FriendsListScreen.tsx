import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { RootStackParamList, TabParamList } from '../../App';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  getFriends,
  getPendingFriendRequests,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '../api/api';
import type { UserSearchResult } from '../api/api';
import type { Friend, FriendRequest } from '../types/invite';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'FriendsList'>,
  StackScreenProps<RootStackParamList>
>;

export default function FriendsListScreen({ navigation: _navigation }: Props) {
  const { theme, colorScheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const trimmed = useMemo(() => query.trim(), [query]);
  const canSearch = trimmed.length > 0;

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [friendsData, pendingData] = await Promise.all([
          getFriends(),
          getPendingFriendRequests(),
        ]);

        if (mounted) {
          setFriends(friendsData);
          setPendingRequests(pendingData);
        }
      } catch (err: unknown) {
        console.error('FriendsListScreen load error:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not connect — check your connection'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSearch() {
    if (!canSearch) return;
    setHasSearched(true);
    setSearchLoading(true);
    try {
      const users = await searchUsers(trimmed);
      setSearchResults(users);
    } catch (err: unknown) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSendRequest(userId: string) {
    try {
      await sendFriendRequest(userId);
      setSearchResults((prev) =>
        prev.map((u) =>
          u.userId === userId ? { ...u, friendshipStatus: 'pending_sent' } : u
        )
      );
    } catch {
      // silently ignore — user can retry
    }
  }

  async function handleAccept(req: FriendRequest) {
    try {
      await respondToFriendRequest(req.id, 'accept');
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      setFriends((prev) => [
        { userId: req.requesterId, username: req.requesterUsername },
        ...prev,
      ]);
    } catch {
      // silently ignore
    }
  }

  async function handleDecline(reqId: number) {
    try {
      await respondToFriendRequest(reqId, 'decline');
      setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch {
      // silently ignore
    }
  }

  function renderSearchActionButton(item: UserSearchResult) {
    switch (item.friendshipStatus) {
      case 'none':
        return (
          <Pressable
            style={({ pressed }) => [{ ...styles.actionButton, backgroundColor: theme.primary }, pressed && styles.buttonPressed]}
            onPress={() => handleSendRequest(item.userId)}
          >
            <Text style={[styles.actionButtonText, { color: theme.textOnPrimary }]}>Send Request</Text>
          </Pressable>
        );
      case 'pending_sent':
        return (
          <Pressable style={[{ ...styles.actionButton, backgroundColor: theme.primary }, styles.actionButtonDisabled]} disabled>
            <Text style={[styles.actionButtonText, { color: theme.textOnPrimary }]}>Request Sent</Text>
          </Pressable>
        );
      case 'accepted':
        return (
          <Pressable style={[{ ...styles.actionButton, backgroundColor: theme.primary }, styles.actionButtonDisabled]} disabled>
            <Text style={[styles.actionButtonText, { color: theme.textOnPrimary }]}>Already Friends</Text>
          </Pressable>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.placeholder }]}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.primary }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.primary }]}>Friends</Text>

        {/* Search section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.placeholder }]}>Add Friend</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={query}
            onChangeText={(text) => setQuery(text.replace(/\s{2,}/g, ' '))}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search by username"
            placeholderTextColor={theme.placeholder}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Pressable
            style={({ pressed }) => [
              { ...styles.searchButton, backgroundColor: theme.primary },
              (!canSearch || searchLoading) && styles.searchButtonDisabled,
              pressed && canSearch && !searchLoading && styles.buttonPressed,
            ]}
            onPress={handleSearch}
            disabled={!canSearch || searchLoading}
          >
            <Text style={[styles.searchButtonText, { color: theme.textOnPrimary }]}>
              {searchLoading ? 'Searching...' : 'Search'}
            </Text>
          </Pressable>

          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>No users found.</Text>
          )}

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.userId}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.row, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
                  {renderSearchActionButton(item)}
                </View>
              )}
            />
          )}
        </View>

        {/* Pending requests section */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.placeholder }]}>Friend Requests</Text>
            {pendingRequests.map((req) => (
              <View key={req.id} style={[styles.row, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <Text style={[styles.username, { color: theme.text }]}>{req.requesterUsername}</Text>
                <View style={styles.rowActions}>
                  <Pressable
                    style={({ pressed }) => [{ ...styles.acceptButton, backgroundColor: theme.primary }, pressed && styles.buttonPressed]}
                    onPress={() => handleAccept(req)}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.textOnPrimary }]}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [{ ...styles.declineButton, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }, pressed && styles.buttonPressed]}
                    onPress={() => handleDecline(req.id)}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.text }]}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Accepted friends section */}
        <View style={styles.section}>
          {(pendingRequests.length > 0 || hasSearched) && (
            <Text style={[styles.sectionHeader, { color: theme.placeholder }]}>My Friends</Text>
          )}
          {friends.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
              No friends yet — search for someone to play with!
            </Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => String(item.userId)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.row, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  searchButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  row: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  username: {
    fontSize: 15,
    flex: 1,
  },
  actionButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  acceptButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  declineButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 15,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
