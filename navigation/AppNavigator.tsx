import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  HistoryScreen,
  HealthScreen,
} from '../screens';
import { COLORS } from '../constants/theme';

export type RootTabParamList = {
  Dashboard: undefined;
  FoodAnalysis: undefined;
  MealRecommendation: undefined;
  WorkoutPlan: undefined;
  AIChatbot: undefined;
  History: undefined;
};

/** Stack gốc sau khi đăng nhập: tab chính + các màn mở toàn màn hình. */
export type RootStackParamList = {
  Tabs: undefined;
  UserProfile: undefined;
  Health: undefined;
};

export type WorkoutPlanStackParamList = {
  WorkoutPlanList: undefined;
  DayDetail: { dayNumber: number };
  ExerciseDetail: { dayNumber: number; exerciseId: number };
  WorkoutSession: { dayNumber: number; exerciseId: number };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutPlanStackParamList>();

function WorkoutPlanStackNavigator() {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <WorkoutStack.Screen name="WorkoutPlanList" component={WorkoutPlanScreen} />
      <WorkoutStack.Screen name="DayDetail" component={DayDetailScreen} />
      <WorkoutStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <WorkoutStack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </WorkoutStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 6);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 58 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        // 6 tab trên màn 360px: bỏ padding ngang để nhãn không bị cắt.
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="FoodAnalysis"
        component={FoodAnalysisScreen}
        options={{
          tabBarLabel: 'Phân tích',
          tabBarIcon: ({ color }) => <Ionicons name="scan" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="MealRecommendation"
        component={MealRecommendationScreen}
        options={{
          tabBarLabel: 'Bữa ăn',
          tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkoutPlan"
        component={WorkoutPlanStackNavigator}
        options={{
          tabBarLabel: 'Tập luyện',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dumbbell" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AIChatbot"
        component={AIChatbotScreen}
        options={{
          tabBarLabel: 'Chat AI',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Lịch sử',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <RootStack.Screen name="Tabs" component={MainTabs} />
      <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
      <RootStack.Screen name="Health" component={HealthScreen} />
    </RootStack.Navigator>
  );
}
