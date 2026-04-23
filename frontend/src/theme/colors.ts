export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  primary: string;
  primaryDark: string;
  textOnPrimary: string;
  inputBackground: string;
  inputBorder: string;
  disabled: string;
  placeholder: string;
};

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  accent: '#4CAF50',
  primary: '#B22222',
  primaryDark: '#8B0000',
  textOnPrimary: '#FFFFFF',
  inputBackground: '#F9F9F9',
  inputBorder: '#B22222',
  disabled: '#CCCCCC',
  placeholder: '#999999',
};

export const darkTheme: ThemeColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  accent: '#4CAF50',
  primary: '#B22222',
  primaryDark: '#8B0000',
  textOnPrimary: '#FFFFFF',
  inputBackground: '#1A1A1A',
  inputBorder: '#B22222',
  disabled: '#444444',
  placeholder: '#888888',
};

// Legacy export for backwards compatibility during migration
export const colors = lightTheme;
