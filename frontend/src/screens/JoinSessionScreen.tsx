import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinSession'>;

export default function JoinSessionScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Session</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
