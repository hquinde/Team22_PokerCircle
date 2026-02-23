import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import JoinSessionScreen from './src/screens/JoinSessionScreen';
import FindFriendsScreen from './src/screens/FindFriendsScreen';

export type RootStackParamList = {
  Home: undefined;
  JoinSession: undefined;
  FindFriends: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
        <Stack.Screen name="FindFriends" component={FindFriendsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
