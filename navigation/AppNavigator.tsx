import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  DashboardScreen,
  FoodImageAnalysisScreen,
  RecipeAnalysisScreen,
  MealRecommendationScreen,
  WorkoutRecommendationScreen,
  AIChatbotScreen,
  UserProfileScreen,
} from '../screens';
import { COLORS } from '../constants/theme';

export type RootTabParamList = {
  Dashboard: undefined;
  FoodImageAnalysis: undefined;
  RecipeAnalysis: undefined;
  MealRecommendation: undefined;
  WorkoutRecommendation: undefined;
  AIChatbot: undefined;
  UserProfile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

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
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FoodImageAnalysis"
        component={FoodImageAnalysisScreen}
        options={{
          tabBarLabel: 'Food Scan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RecipeAnalysis"
        component={RecipeAnalysisScreen}
        options={{
          tabBarLabel: 'Recipe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MealRecommendation"
        component={MealRecommendationScreen}
        options={{
          tabBarLabel: 'Meals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkoutRecommendation"
        component={WorkoutRecommendationScreen}
        options={{
          tabBarLabel: 'Workout',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AIChatbot"
        component={AIChatbotScreen}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
