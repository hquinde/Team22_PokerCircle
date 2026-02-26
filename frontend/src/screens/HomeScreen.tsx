import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokerCircle</Text>

      <View style={styles.buttonContainer}>
        {/* Get Started */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('JoinSession')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        {/* Find Friends */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('FindFriends')}
        >
          <Text style={styles.secondaryButtonText}>Find Friends</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 42,
    letterSpacing: 3,
    marginBottom: 60,
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },

  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 14,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },

  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
