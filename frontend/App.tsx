import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import HomeScreen from './src/screens/HomeScreen';
import JoinSessionScreen from './src/screens/JoinSessionScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import GameScreen from './src/screens/GameScreen';
import InviteFriendsScreen from './src/screens/InviteFriendsScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import FriendsListScreen from './src/screens/FriendsListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';

import ErrorBoundary from './src/components/ErrorBoundary';
import { BACKEND_URL } from './src/config/api';
import { loadAuth } from './src/services/authStorage';
import { colors } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

export type TabParamList = {
  Home: undefined;
  FriendsList: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;

  Home: undefined;
  FriendsList: undefined;
  Profile: undefined;
  Leaderboard: undefined;
  Discover: undefined;

  JoinSession: { preFilledCode?: string } | undefined;
  Lobby: { sessionCode: string };
  InviteFriends: { sessionCode: string };
  Game: { sessionCode: string; buyInAmount?: number };
  Results: { sessionCode: string };
  SessionDetail: { sessionCode: string };
  Leaderboard: undefined;
  Discover: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/* ---------------- TAB NAVIGATOR ---------------- */
function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof TabParamList } }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.placeholder,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: any;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'FriendsList') iconName = 'people';
          else if (route.name === 'Profile') iconName = 'person';
          else iconName = 'ellipse';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...(props as any)} />}
      </Tab.Screen>

      <Tab.Screen name="FriendsList">
        {(props) => <FriendsListScreen {...(props as any)} />}
      </Tab.Screen>

      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...(props as any)} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/* ---------------- AUTH STATE & APP CONTENT ---------------- */
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function AppContent({ authStatus, navigationRef }: { authStatus: AuthStatus; navigationRef: any }) {
  const { theme, colorScheme } = useTheme();

  return (
    <ErrorBoundary>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          initialRouteName={authStatus === 'authenticated' ? 'MainTabs' : 'Welcome'}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.background,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTintColor: theme.primary,
            headerTitle: '',
          }}
        >
          {/* AUTH */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />

          {/* MAIN APP (WITH TABS) */}
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

          {/* SESSION SCREENS (NO TAB BAR) */}
          <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
          <Stack.Screen name="Lobby" component={LobbyScreen} />
          <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const navigationRef = useRef<any>(null);
  const notifListenerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const stored = await loadAuth();

        if (!stored) {
          if (!cancelled) setAuthStatus('unauthenticated');
          return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
            credentials: 'include',
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!cancelled) {
            setAuthStatus(res.ok ? 'authenticated' : 'unauthenticated');
          }
        } catch {
          clearTimeout(timeout);
          if (!cancelled) setAuthStatus('unauthenticated');
        }
      } catch {
        if (!cancelled) setAuthStatus('unauthenticated');
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    notifListenerRef.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (!navigationRef.isReady()) return;

      if (data?.type === 'friend_request') {
        navigationRef.navigate('MainTabs');
        // Give the tab navigator a moment to mount before switching tabs
        setTimeout(() => {
          if (navigationRef.isReady()) navigationRef.navigate('FriendsList' as any);
        }, 300);
      } else if (data?.type === 'session_invite') {
        navigationRef.navigate('MainTabs');
      }
    });

    return () => {
      notifListenerRef.current?.remove();
    };
  }, []);

  /* ---------------- LOADING SCREEN ---------------- */
  if (authStatus === 'loading') {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppContent authStatus={authStatus} navigationRef={navigationRef} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
