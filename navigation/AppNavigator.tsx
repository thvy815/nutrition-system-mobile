import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  DashboardScreen,
  FoodAnalysisScreen,
  MealRecommendationScreen,
  AIChatbotScreen,
  UserProfileScreen,
  WorkoutPlanScreen,
  DayDetailScreen,
  ExerciseDetailScreen,
  WorkoutSessionScreen,
} from '../screens';
import { COLORS } from '../constants/theme';

export type RootTabParamList = {
  Dashboard: undefined;
  FoodAnalysis: undefined;
  MealRecommendation: undefined;
  WorkoutPlan: undefined;
  AIChatbot: undefined;
  UserProfile: undefined;
};

export type WorkoutPlanStackParamList = {
  WorkoutPlanList: undefined;
  DayDetail: { dayNumber: number };
  ExerciseDetail: { dayNumber: number; exerciseId: number };
  WorkoutSession: { dayNumber: number; exerciseId: number };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutPlanStackParamList>();

// Workout Plan Stack Navigator
function WorkoutPlanStackNavigator() {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <WorkoutStack.Screen
        name="WorkoutPlanList"
        component={WorkoutPlanScreen}
      />
      <WorkoutStack.Screen
        name="DayDetail"
        component={DayDetailScreen}
      />
      <WorkoutStack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
      />
      <WorkoutStack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
      />
    </WorkoutStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FoodAnalysis"
        component={FoodAnalysisScreen}
        options={{
          tabBarLabel: 'Phân tích',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MealRecommendation"
        component={MealRecommendationScreen}
        options={{
          tabBarLabel: 'Bữa ăn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkoutPlan"
        component={WorkoutPlanStackNavigator}
        options={{
          tabBarLabel: 'Tập luyện',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AIChatbot"
        component={AIChatbotScreen}
        options={{
          tabBarLabel: 'Chat AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
