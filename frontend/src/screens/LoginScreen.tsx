import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../theme/ThemeContext';
import { BACKEND_URL } from '../config/api';
import { saveAuth } from '../services/authStorage';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { theme, colorScheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'main' | 'demo1' | 'demo2' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const doLogin = async (
    key: 'main' | 'demo1' | 'demo2',
    loginEmail: string,
    loginPassword: string,
  ) => {
    if (loading) return;
    setErrorMessage(null);
    setLoading(key);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json() as {
        userID?: string;
        username?: string;
        email?: string;
        message?: string;
        error?: string;
      };

      if (response.ok && data.userID && data.username && data.email) {
        await saveAuth({
          userID: data.userID,
          username: data.username,
          email: data.email,
        });
        navigation.replace('MainTabs');
      } else {
        setErrorMessage(data.message ?? data.error ?? 'Login failed. Please try again.');
      }
    } catch {
      setErrorMessage('Could not connect to server. Check your connection.');
    } finally {
      setLoading(null);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    await doLogin('main', email, password);
  };

  const handleDemoLogin = (key: 'demo1' | 'demo2', demoEmail: string, demoPassword: string) =>
    doLogin(key, demoEmail, demoPassword);

  return (
    <>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primaryDark }]}>Login</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
        placeholder="Email"
        placeholderTextColor={theme.placeholder}
        value={email}
        onChangeText={(t) => { setEmail(t); setErrorMessage(null); }}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
        placeholder="Password"
        placeholderTextColor={theme.placeholder}
        value={password}
        onChangeText={(t) => { setPassword(t); setErrorMessage(null); }}
        secureTextEntry
      />

      {errorMessage !== null && (
        <Text style={[styles.errorText, { color: theme.primary }]}>{errorMessage}</Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.button, { backgroundColor: theme.primary }, pressed && styles.buttonPressed]}
        onPress={handleLogin}
        disabled={loading !== null}
      >
        {loading === 'main' ? (
          <ActivityIndicator color={theme.textOnPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.textOnPrimary }]}>Login</Text>
        )}
      </Pressable>

      <View style={[styles.demoSection, { borderTopColor: theme.inputBorder }]}>
        <Text style={[styles.demoLabel, { color: theme.placeholder }]}>Quick Login (Testing)</Text>
        <Pressable
          style={({ pressed }) => [styles.demoButton, { borderColor: theme.inputBorder }, pressed && styles.buttonPressed]}
          onPress={() => handleDemoLogin('demo1', 'demo1@pokercircle.dev', '000000')}
          disabled={loading !== null}
        >
          {loading === 'demo1' ? (
            <ActivityIndicator color={theme.text} size="small" />
          ) : (
            <Text style={[styles.demoButtonText, { color: theme.text }]}>Login as Demo 1</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.demoButton, { borderColor: theme.inputBorder }, pressed && styles.buttonPressed]}
          onPress={() => handleDemoLogin('demo2', 'demo2@pokercircle.dev', '000000')}
          disabled={loading !== null}
        >
          {loading === 'demo2' ? (
            <ActivityIndicator color={theme.text} size="small" />
          ) : (
            <Text style={[styles.demoButtonText, { color: theme.text }]}>Login as Demo 2</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('Signup')} style={styles.link}>
        <Text style={[styles.linkText, { color: theme.primary }]}>Don't have an account? Sign Up</Text>
      </Pressable>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    width: '100%',
    maxWidth: 320,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    width: '100%',
    maxWidth: 320,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    maxWidth: 320,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 24,
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 10,
    width: '100%',
    maxWidth: 320,
  },
  demoLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  linkText: {
    fontSize: 16,
  },
});
