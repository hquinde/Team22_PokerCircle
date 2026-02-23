import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

type Props = StackScreenProps<RootStackParamList, 'JoinSession'>;

export default function JoinSessionScreen(_props: Props) {
  const [sessionCode, setSessionCode] = useState('');

  const isValid = sessionCode.length === 6;

  function handleChangeText(text: string) {
    setSessionCode(text.replace(/\s/g, '').toUpperCase());
  }

  function handleJoin() {
    console.log('Session code:', sessionCode);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join Session</Text>
        <Text style={styles.label}>Enter 6-character session code</Text>

        <TextInput
          style={styles.input}
          value={sessionCode}
          onChangeText={handleChangeText}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="XXXXXX"
          placeholderTextColor="#888"
        />

        <Pressable
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={!isValid}
        >
          <Text style={styles.buttonText}>Join Game</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D', // black
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
    color: '#B22222', // red title
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#B22222', // red border
    backgroundColor: '#1A1A1A', // dark gray input
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: '#B22222', // red button
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#444', // dark gray disabled
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
