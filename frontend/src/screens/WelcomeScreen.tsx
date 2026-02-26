import React from 'react';
import { StyleSheet, Text, View, Pressable, ImageBackground } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';

type Props = StackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>♠️</Text>
        <Text style={styles.title}>PokerCircle</Text>
        <Text style={styles.subtitle}>The ultimate private poker ledger.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.loginButton, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.button, styles.signupButton, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 18,
    color: colors.placeholder,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loginButton: {
    backgroundColor: colors.primary,
  },
  loginButtonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  signupButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
