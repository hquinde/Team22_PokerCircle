import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
} from '../api/api';
import type { UserSearchResult } from '../api/api';

type Props = StackScreenProps<RootStackParamList, 'FindFriends'>;

export default function FindFriendsScreen(_props: Props) {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [addError, setAddError] = useState<string | null>(null);

  const trimmed = useMemo(() => query.trim(), [query]);
  const canSearch = trimmed.length > 0;

  function handleChangeText(text: string) {
    setQuery(text.replace(/\s{2,}/g, ' '));
  }

  async function handleSearch() {
    if (!canSearch) return;

    setHasSearched(true);
    setLoading(true);
    setAddError(null);

    try {
      const users = await searchUsers(trimmed);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(userId: string) {
    try {
      await sendFriendRequest(userId);
      setResults((prev) =>
        prev.map((u) =>
          u.userId === userId ? { ...u, friendshipStatus: 'pending_sent' } : u
        )
      );
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to send friend request');
    }
  }

  async function handleAcceptRequest(userId: string, requestId: number) {
    try {
      await respondToFriendRequest(requestId, 'accept');
      setResults((prev) =>
        prev.map((u) =>
          u.userId === userId ? { ...u, friendshipStatus: 'accepted' } : u
        )
      );
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to accept friend request');
    }
  }

  function renderActionButton(item: UserSearchResult) {
    switch (item.friendshipStatus) {
      case 'none':
        return (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
            onPress={() => handleAddFriend(item.userId)}
          >
            <Text style={styles.addButtonText}>Add Friend</Text>
          </Pressable>
        );
      case 'pending_sent':
        return (
          <Pressable style={[styles.addButton, styles.addButtonDisabled]} disabled>
            <Text style={styles.addButtonText}>Request Sent</Text>
          </Pressable>
        );
      case 'pending_received':
        return (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
            onPress={() => handleAcceptRequest(item.userId, item.friendshipId ?? 0)}
          >
            <Text style={styles.addButtonText}>Accept</Text>
          </Pressable>
        );
      case 'accepted':
        return (
          <Pressable style={[styles.addButton, styles.addButtonDisabled]} disabled>
            <Text style={styles.addButtonText}>Already Friends</Text>
          </Pressable>
        );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <Text style={styles.title}>Find Friends</Text>
        <Text style={styles.label}>Search players by username</Text>

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. isabella24"
          placeholderTextColor={colors.placeholder}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSearch && styles.buttonDisabled,
            pressed && canSearch && styles.buttonPressed,
          ]}
          onPress={handleSearch}
          disabled={!canSearch || loading}
        >
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>

        {addError !== null && (
          <Text style={styles.errorText}>{addError}</Text>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <Text style={styles.emptyText}>No users found.</Text>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.resultRow}>
              <Text style={styles.username}>{item.username}</Text>
              {renderActionButton(item)}
            </View>
          )}
        />
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
    paddingHorizontal: 32,
    paddingTop: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 8,
    letterSpacing: 1,
  },

  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: colors.text,
    marginBottom: 14,
  },

  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },

  buttonDisabled: {
    backgroundColor: colors.disabled,
  },

  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
  },

  errorText: {
    color: colors.primary,
    fontSize: 13,
    marginBottom: 8,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  loadingText: {
    color: colors.text,
    fontSize: 14,
    marginLeft: 10,
  },

  emptyText: {
    color: colors.placeholder,
    fontSize: 14,
    paddingTop: 8,
  },

  resultRow: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  username: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  addButtonDisabled: {
    backgroundColor: colors.disabled,
  },

  addButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});
