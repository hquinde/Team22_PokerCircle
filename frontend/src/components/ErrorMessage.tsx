import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorMessage({
  message = 'Something went wrong.',
  onRetry,
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Oops</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

      {onRetry ? (
        <Pressable style={[styles.button, { borderColor: theme.primary }]} onPress={onRetry}>
          <Text style={[styles.buttonText, { color: theme.primary }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
});