/**
 * Root Navigation Setup with Workout Feature
 * This shows how to integrate WorkoutNavigator into the app
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { LoginScreen } from '../screens';
import { AppNavigator } from './AppNavigator';
import { WorkoutNavigator } from './WorkoutNavigator';

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
  WorkoutFlow: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  // Check if user is authenticated (replace with your auth logic)
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <>
            <Stack.Screen name="App" component={AppNavigator} />
            <Stack.Screen
              name="WorkoutFlow"
              component={WorkoutNavigator}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
