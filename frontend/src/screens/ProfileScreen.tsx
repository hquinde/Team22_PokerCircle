import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { RootStackParamList, TabParamList } from '../../App';
import { useTheme } from '../theme/ThemeContext';
import { getUserStats, getUserSessions, updateDisplayName, updateAvatar, getNotificationPreferences, updateNotificationPreferences } from '../api/api';
import { exportSessionsToCSV } from '../utils/exportCSV';
import { BACKEND_URL } from '../config/api';
import type { UserStats, UserSession } from '../types/profile';
import AvatarDisplay from '../components/AvatarDisplay';
import AvatarPickerModal from '../components/AvatarPickerModal';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  StackScreenProps<RootStackParamList>
>;

function formatNet(value: number): string {
  const abs = Math.abs(value).toFixed(2);
  return value >= 0 ? `+$${abs}` : `-$${abs}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProfileScreen({ navigation }: Props) {
  const { theme, colorScheme, colorSchemeOverride, setColorScheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number>(0);
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState<UserStats>({
    sessionsPlayed: 0,
    totalNet: 0,
    biggestWin: 0,
    biggestLoss: 0,
  });
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [winFilter, setWinFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [exporting, setExporting] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    friendRequests: true,
    sessionInvites: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        searchText.trim() === '' ||
        s.sessionCode.toLowerCase().includes(searchText.trim().toLowerCase());
      const matchesFilter =
        winFilter === 'all' ||
        (winFilter === 'win' && s.net > 0) ||
        (winFilter === 'loss' && s.net < 0);
      return matchesSearch && matchesFilter;
    });
  }, [sessions, searchText, winFilter]);

  useEffect(() => {
    async function load() {
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (!meRes.ok) throw new Error('Not authenticated');
      const me = (await meRes.json()) as { userID: string; username: string; avatar?: string | null };

      const [fetchedStats, fetchedSessions] = await Promise.all([
        getUserStats(me.userID as any),
        getUserSessions(me.userID as any),
      ]);

      const prefs = await getNotificationPreferences(me.userID);
      setUserId(me.userID as any);
      setUsername(me.username);
      setAvatar(me.avatar ?? null);
      setStats(fetchedStats);
      setSessions(fetchedSessions);
      setNotificationPrefs(prefs);
    }

    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startEdit() {
    setEditValue(username);
    setEditError('');
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditError('');
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportSessionsToCSV(sessions, username);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Export failed', msg);
    } finally {
      setExporting(false);
    }
  }

  async function confirmEdit() {
    if (editLoading) return;
    setEditLoading(true);
    try {
      const updated = await updateDisplayName(userId, editValue.trim());
      setUsername(updated);
      setEditMode(false);
      setEditError('');
    } catch (err: any) {
      setEditError(err.message ?? 'Failed to update display name');
    } finally {
      setEditLoading(false);
    }
  }

  async function handlePreferenceToggle(key: 'friendRequests' | 'sessionInvites') {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    setPrefsLoading(true);
    try {
      await updateNotificationPreferences(userId, newPrefs);
    } catch (err: any) {
      setPrefsLoading(false);
      Alert.alert('Error', err.message ?? 'Failed to update preferences');
      setNotificationPrefs(notificationPrefs);
    }
    setPrefsLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.placeholder }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.avatarWrapper}>
          <AvatarDisplay avatarId={avatar} size={72} />
          <Text style={[styles.avatarEditHint, { color: theme.placeholder }]}>Tap to change</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          {editMode ? (
            <>
              <TextInput
                style={[styles.nameInput, { color: theme.primary, borderBottomColor: theme.primary }]}
                value={editValue}
                onChangeText={setEditValue}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={confirmEdit}
              />
              <TouchableOpacity
                onPress={confirmEdit}
                disabled={editLoading}
                style={styles.editActionBtn}
              >
                <Text style={[styles.editActionText, { color: theme.text }]}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEdit} style={styles.editActionBtn}>
                <Text style={[styles.editActionText, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.primary }]}>{username}</Text>
              <TouchableOpacity onPress={startEdit} style={styles.editIconBtn}>
                <Text style={[styles.editIcon, { color: theme.placeholder }]}>✎</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {editError ? <Text style={[styles.editErrorText]}>{editError}</Text> : null}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.sessionsPlayed}</Text>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>Sessions Played</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Text
              style={[
                styles.statValue,
                { color: stats.totalNet >= 0 ? '#4CAF50' : '#F44336' },
              ]}
            >
              {formatNet(stats.totalNet)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>Total Net</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {formatNet(stats.biggestWin)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>Biggest Win</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {formatNet(stats.biggestLoss)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>Biggest Loss</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Notification Preferences</Text>

        <View style={[styles.preferencesContainer, { backgroundColor: theme.surface }]}>
          <View style={[styles.preferenceRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.preferenceLabel, { color: theme.text }]}>Friend Requests</Text>
            <Switch
              value={notificationPrefs.friendRequests}
              onValueChange={() => handlePreferenceToggle('friendRequests')}
              disabled={prefsLoading}
            />
          </View>

          <View style={[styles.preferenceRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.preferenceLabel, { color: theme.text }]}>Session Invites</Text>
            <Switch
              value={notificationPrefs.sessionInvites}
              onValueChange={() => handlePreferenceToggle('sessionInvites')}
              disabled={prefsLoading}
            />
          </View>

          <View style={styles.themeToggleSection}>
            <Text style={[styles.preferenceLabel, { color: theme.text }]}>Theme</Text>
            <View style={styles.themeToggleGroup}>
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={async () => await setColorScheme(mode)}
                  style={[
                    styles.themeToggleBtn,
                    colorSchemeOverride === mode && styles.themeToggleBtnActive,
                    { borderColor: theme.border, backgroundColor: colorSchemeOverride === mode ? theme.primary : theme.inputBackground }
                  ]}
                >
                  <Text style={[
                    styles.themeToggleBtnText,
                    colorSchemeOverride === mode && styles.themeToggleBtnTextActive,
                    { color: colorSchemeOverride === mode ? theme.textOnPrimary : theme.text }
                  ]}>
                    {mode === 'system' ? '◉ System' : mode === 'light' ? '☀ Light' : '◑ Dark'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Session History</Text>

        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Search sessions..."
          placeholderTextColor={theme.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />

        <View style={styles.filterRow}>
          {(['all', 'win', 'loss'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setWinFilter(f)}
              style={[
                styles.filterBtn,
                {
                  borderColor: winFilter === f ? theme.primary : theme.inputBorder,
                  backgroundColor: winFilter === f ? theme.primary : theme.inputBackground,
                },
              ]}
            >
              <Text style={[
                styles.filterBtnText,
                {
                  color: winFilter === f ? theme.textOnPrimary : theme.placeholder,
                },
              ]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {sessions.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>No completed sessions yet</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>No sessions match your search</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSessions}
            keyExtractor={(item) => item.sessionCode}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sessionRow, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={() => navigation.navigate('SessionDetail', { sessionCode: item.sessionCode })}
              >
                <View style={styles.sessionMain}>
                  <Text style={[styles.sessionCode, { color: theme.text }]}>{item.sessionCode}</Text>
                  <Text style={[styles.sessionDate, { color: theme.placeholder }]}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.sessionRight}>
                  <Text
                    style={[
                      styles.sessionNet,
                      { color: item.net >= 0 ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {formatNet(item.net)}
                  </Text>
                  <Text style={[styles.sessionPlayers, { color: theme.placeholder }]}>{item.playerCount} players</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
        <TouchableOpacity
          style={[
            styles.exportBtn,
            sessions.length === 0 && { ...styles.exportBtnDisabled, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground },
            sessions.length > 0 && { backgroundColor: theme.primary },
          ]}
          onPress={handleExport}
          disabled={sessions.length === 0 || exporting}
        >
          <Text style={[
            styles.exportBtnText,
            sessions.length === 0 && { color: theme.placeholder },
            sessions.length > 0 && { color: theme.textOnPrimary },
          ]}>
            {sessions.length === 0
              ? 'No sessions to export'
              : exporting
              ? 'Exporting...'
              : 'Export Session History'}
          </Text>
        </TouchableOpacity>
      </View>
      <AvatarPickerModal
        visible={pickerVisible}
        currentAvatarId={avatar}
        onClose={() => setPickerVisible(false)}
        onSelect={async (id) => {
          const previous = avatar;
          setPickerVisible(false);
          setAvatar(id);
          try {
            await updateAvatar(userId, id);
          } catch {
            setAvatar(previous);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  header: {
    marginBottom: 10,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  backText: {
    fontSize: 14,
    fontWeight: '600',
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarEditHint: {
    marginTop: 6,
    fontSize: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    flex: 1,
  },

  editIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  editIcon: {
    fontSize: 22,
  },

  nameInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    borderBottomWidth: 1,
    paddingVertical: 2,
    letterSpacing: 1,
  },

  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  editActionText: {
    fontSize: 22,
  },

  editErrorText: {
    color: '#F44336',
    fontSize: 13,
    marginBottom: 12,
    marginTop: -12,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  positive: {
    color: '#4CAF50',
  },

  negative: {
    color: '#F44336',
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },

  sessionRow: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sessionMain: {
    flex: 1,
  },

  sessionCode: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  sessionDate: {
    fontSize: 12,
  },

  sessionRight: {
    alignItems: 'flex-end',
  },

  sessionNet: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },

  sessionPlayers: {
    fontSize: 12,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  filterBtn: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },

  filterBtnActive: {
    borderWidth: 1,
  },

  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  filterBtnTextActive: {
    fontWeight: '700',
  },

  exportBtn: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  exportBtnDisabled: {
    borderWidth: 1,
  },

  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  exportBtnTextDisabled: {
    fontWeight: '700',
  },

  ratingDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: -12,
  },
  ratingStars: {
    fontSize: 18,
    color: '#FFC107',
    letterSpacing: 2,
  },
  ratingText: {
    fontSize: 13,
  },

  preferencesContainer: {
    marginBottom: 24,
    borderRadius: 8,
    padding: 16,
  },

  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },

  themeToggleSection: {
    paddingTop: 12,
    paddingBottom: 0,
  },

  themeToggleGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  themeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  themeToggleBtnActive: {
    borderWidth: 1,
  },

  themeToggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  themeToggleBtnTextActive: {
    fontWeight: '700',
  },
});
