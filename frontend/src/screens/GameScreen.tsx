import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';

type Props = StackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route }: Props) {
  const { sessionCode } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Game Starting</Text>
        <Text style={styles.code}>{sessionCode}</Text>
        <Text style={styles.subtitle}>Poker game coming soon...</Text>
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
    color: colors.primary,
    marginBottom: 12,
  },
  code: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 6,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.placeholder,
  },
});