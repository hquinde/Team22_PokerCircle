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
  Alert,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';
import { searchUsers, type UserSummary } from '../api/api';

type Props = StackScreenProps<RootStackParamList, 'FindFriends'>;

export default function FindFriendsScreen(_props: Props) {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserSummary[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const trimmed = useMemo(() => query.trim(), [query]);
  const canSearch = trimmed.length >= 3;

  function handleChangeText(text: string) {
    setQuery(text.replace(/\s{2,}/g, ' '));
    if (error) setError(null);
  }

  async function handleSearch() {
    if (!canSearch) {
      setError('Search query must be at least 3 characters.');
      return;
    }

    setHasSearched(true);
    setLoading(true);
    setError(null);

    try {
      const data = await searchUsers(trimmed);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddFriend(friendId: string) {
    if (sentRequests.includes(friendId)) return;
    setSentRequests((prev) => [...prev, friendId]);
    Alert.alert('Friend Request Sent', 'Your request has been sent successfully.');
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

        {error && <Text style={styles.errorText}>{error}</Text>}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && hasSearched && results.length === 0 && !error && (
          <Text style={styles.emptyText}>No users found.</Text>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const sent = sentRequests.includes(item.id);

            return (
              <View style={styles.resultRow}>
                <Text style={styles.username}>{item.displayName}</Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    sent && styles.addButtonDisabled,
                    pressed && !sent && styles.buttonPressed,
                  ]}
                  onPress={() => handleAddFriend(item.id)}
                  disabled={sent}
                >
                  <Text style={styles.addButtonText}>
                    {sent ? 'Request Sent' : 'Add Friend'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
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

  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 10,
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