/**
 * WorkoutNavigator
 * Navigation stack for workout feature
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import {
  WorkoutPlanScreen,
  DayDetailScreen,
  ExerciseDetailScreen,
  WorkoutSessionScreen,
} from '../screens';

export type WorkoutStackParamList = {
  WorkoutPlan: undefined;
  DayDetail: { dayNumber: number };
  ExerciseDetail: { dayNumber: number; exerciseId: number };
  WorkoutSession: { dayNumber: number; exerciseId: number };
};

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export function WorkoutNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="WorkoutPlan"
        component={WorkoutPlanScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
