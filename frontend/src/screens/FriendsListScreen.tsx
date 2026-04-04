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
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';
import {
  getFriends,
  getPendingFriendRequests,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '../api/api';
import type { UserSearchResult } from '../api/api';
import type { Friend, FriendRequest } from '../types/invite';

type Props = StackScreenProps<RootStackParamList, 'FriendsList'>;

export default function FriendsListScreen({ navigation: _navigation }: Props) {
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
            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
            onPress={() => handleSendRequest(item.userId)}
          >
            <Text style={styles.actionButtonText}>Send Request</Text>
          </Pressable>
        );
      case 'pending_sent':
        return (
          <Pressable style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Text style={styles.actionButtonText}>Request Sent</Text>
          </Pressable>
        );
      case 'accepted':
        return (
          <Pressable style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Text style={styles.actionButtonText}>Already Friends</Text>
          </Pressable>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Friends</Text>

        {/* Search section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Add Friend</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={(text) => setQuery(text.replace(/\s{2,}/g, ' '))}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search by username"
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              (!canSearch || searchLoading) && styles.searchButtonDisabled,
              pressed && canSearch && !searchLoading && styles.buttonPressed,
            ]}
            onPress={handleSearch}
            disabled={!canSearch || searchLoading}
          >
            <Text style={styles.searchButtonText}>
              {searchLoading ? 'Searching...' : 'Search'}
            </Text>
          </Pressable>

          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <Text style={styles.emptyText}>No users found.</Text>
          )}

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.userId}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.username}>{item.username}</Text>
                  {renderSearchActionButton(item)}
                </View>
              )}
            />
          )}
        </View>

        {/* Pending requests section */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Friend Requests</Text>
            {pendingRequests.map((req) => (
              <View key={req.id} style={styles.row}>
                <Text style={styles.username}>{req.requesterUsername}</Text>
                <View style={styles.rowActions}>
                  <Pressable
                    style={({ pressed }) => [styles.acceptButton, pressed && styles.buttonPressed]}
                    onPress={() => handleAccept(req)}
                  >
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.declineButton, pressed && styles.buttonPressed]}
                    onPress={() => handleDecline(req.id)}
                  >
                    <Text style={styles.actionButtonText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Accepted friends section */}
        <View style={styles.section}>
          {(pendingRequests.length > 0 || hasSearched) && (
            <Text style={styles.sectionHeader}>My Friends</Text>
          )}
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>
              No friends yet — search for someone to play with!
            </Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => String(item.userId)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.username}>{item.username}</Text>
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
    backgroundColor: colors.background,
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
    color: colors.primary,
    marginBottom: 20,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  searchButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  row: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
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
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  declineButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  emptyText: {
    color: colors.placeholder,
    fontSize: 15,
  },
  loadingText: {
    color: colors.placeholder,
    fontSize: 15,
    marginTop: 12,
  },
  errorText: {
    color: colors.primary,
    fontSize: 15,
    textAlign: 'center',
  },
});
