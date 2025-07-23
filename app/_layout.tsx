import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import { UnitsProvider } from '@/hooks/useUnits';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Create a separate component that can access the theme context
function RootLayoutContent() {
  const { colors, theme } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar 
        style={theme === 'dark' ? 'light' : 'dark'}
        // backgroundColor={colors.background}
        translucent={true}
      />
      <Stack
        screenOptions={{
          headerStyle: { 
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          contentStyle: { 
            backgroundColor: colors.background 
          },
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          presentation: 'card',
          animationTypeForReplace: 'push',
        }}
      />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UnitsProvider>
          <RootLayoutContent />
        </UnitsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}