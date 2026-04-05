import { useState } from 'react';
import {
  ActivityIndicator, Pressable, SafeAreaView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';
import { getSession } from '../api/api';

type Props = StackScreenProps<RootStackParamList, 'JoinSession'>;

export default function JoinSessionScreen({ navigation, route }: Props) {
  const preFilledCode = route.params?.preFilledCode ?? '';
  const [sessionCode, setSessionCode] = useState(preFilledCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = sessionCode.length === 6;

  function handleChangeText(text: string) {
    setSessionCode(text.replace(/\s/g, '').toUpperCase());
    setErrorMessage(null);
  }

  async function handleJoin() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await getSession(sessionCode);
      // Session exists — navigate to lobby
      navigation.navigate('Lobby', { sessionCode });
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404) {
        setErrorMessage(`No session found with code "${sessionCode}". Double-check and try again.`);
      } else {
        setErrorMessage('Could not connect to server. Check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join Session</Text>

        <Text style={styles.label}>Enter 6-character session code</Text>

        <TextInput
          style={[styles.input, errorMessage !== null && styles.inputError]}
          value={sessionCode}
          onChangeText={handleChangeText}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="XXXXXX"
          placeholderTextColor={colors.placeholder}
          editable={!isSubmitting}
        />

        {sessionCode.length > 0 && sessionCode.length < 6 && errorMessage === null && (
          <Text style={styles.helperText}>Session code must be 6 characters.</Text>
        )}

        {errorMessage !== null && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <Pressable
          style={[
            styles.button,
            (!isValid || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={handleJoin}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.buttonText}>Join Game</Text>
          )}
        </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 8,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8,
  },
  inputError: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  helperText: {
    width: '100%',
    color: colors.placeholder,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'left',
  },
  errorText: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});