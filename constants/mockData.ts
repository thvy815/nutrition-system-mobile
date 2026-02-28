import type { Meal, Workout, FoodAnalysisResult, RecipeAnalysisResult, UserProfile } from '../types';

export const MOCK_USER_PROFILE: UserProfile = {
  age: 28,
  gender: 'male',
  height: 175,
  weight: 75,
  activityLevel: 'moderate',
  healthGoal: 'build_muscle',
  dietaryRestrictions: ['gluten-free'],
};

export const MOCK_DASHBOARD = {
  dailyCalorieTarget: 2200,
  caloriesConsumed: 1450,
  caloriesBurned: 320,
  weight: 75,
  bmi: 24.5,
  todayMeals: [
    { id: '1', name: 'Greek Yogurt with Berries', calories: 280, protein: 18, carbs: 32, fat: 8, timeOfDay: 'breakfast' as const },
    { id: '2', name: 'Grilled Chicken Salad', calories: 420, protein: 35, carbs: 22, fat: 22, timeOfDay: 'lunch' as const },
    { id: '3', name: 'Salmon with Quinoa', calories: 550, protein: 42, carbs: 45, fat: 22, timeOfDay: 'dinner' as const },
    { id: '4', name: 'Protein Shake', calories: 200, protein: 25, carbs: 8, fat: 2, timeOfDay: 'snack' as const },
  ] as Meal[],
  todayWorkouts: [
    { id: '1', name: 'Upper Body Strength', duration: 45, difficulty: 'intermediate' as const, caloriesBurned: 280 },
    { id: '2', name: 'Evening Walk', duration: 20, difficulty: 'beginner' as const, caloriesBurned: 90 },
  ] as Workout[],
};

export const MOCK_FOOD_ANALYSIS: FoodAnalysisResult = {
  foodName: 'Grilled Chicken Caesar Salad',
  ingredients: ['Chicken breast', 'Romaine lettuce', 'Parmesan cheese', 'Caesar dressing', 'Croutons'],
  calories: 485,
  protein: 42,
  carbs: 18,
  fat: 28,
};

export const MOCK_RECIPE_ANALYSIS: RecipeAnalysisResult = {
  ingredients: [
    { name: 'Chicken breast (200g)', calories: 330, protein: 62, carbs: 0, fat: 7 },
    { name: 'Brown rice (150g)', calories: 165, protein: 4, carbs: 34, fat: 1 },
    { name: 'Broccoli (100g)', calories: 34, protein: 3, carbs: 7, fat: 0 },
    { name: 'Olive oil (1 tbsp)', calories: 120, protein: 0, carbs: 0, fat: 14 },
  ],
  totalCalories: 649,
  totalProtein: 69,
  totalCarbs: 41,
  totalFat: 22,
};

export const MOCK_MEAL_RECOMMENDATIONS: { daily: Meal[]; weekly: Meal[] } = {
  daily: [
    { id: '1', name: 'Oatmeal with Banana', calories: 350, protein: 12, carbs: 58, fat: 8, goalTag: 'build_muscle' },
    { id: '2', name: 'Turkey Wrap', calories: 420, protein: 28, carbs: 45, fat: 14, goalTag: 'build_muscle' },
    { id: '3', name: 'Beef Stir Fry', calories: 520, protein: 38, carbs: 42, fat: 22, goalTag: 'build_muscle' },
    { id: '4', name: 'Greek Yogurt Parfait', calories: 220, protein: 15, carbs: 28, fat: 6, goalTag: 'build_muscle' },
  ],
  weekly: [
    { id: 'w1', name: 'Eggs Benedict', calories: 450, protein: 22, carbs: 28, fat: 28, goalTag: 'build_muscle' },
    { id: 'w2', name: 'Mediterranean Bowl', calories: 480, protein: 25, carbs: 52, fat: 20, goalTag: 'build_muscle' },
    { id: 'w3', name: 'Grilled Salmon', calories: 520, protein: 45, carbs: 15, fat: 32, goalTag: 'build_muscle' },
    { id: 'w4', name: 'Chicken Buddha Bowl', calories: 420, protein: 35, carbs: 48, fat: 12, goalTag: 'build_muscle' },
    { id: 'w5', name: 'Tuna Poke Bowl', calories: 480, protein: 42, carbs: 42, fat: 18, goalTag: 'build_muscle' },
  ],
};

export const MOCK_WORKOUT_RECOMMENDATIONS: { daily: Workout[]; weekly: Workout[] } = {
  daily: [
    { id: '1', name: 'Push Day - Chest & Triceps', duration: 50, difficulty: 'intermediate', caloriesBurned: 320 },
    { id: '2', name: 'HIIT Cardio', duration: 25, difficulty: 'advanced', caloriesBurned: 280 },
  ],
  weekly: [
    { id: 'w1', name: 'Full Body Strength', duration: 60, difficulty: 'intermediate', caloriesBurned: 380 },
    { id: 'w2', name: 'Leg Day', duration: 45, difficulty: 'advanced', caloriesBurned: 350 },
    { id: 'w3', name: 'Pull Day - Back & Biceps', duration: 50, difficulty: 'intermediate', caloriesBurned: 300 },
    { id: 'w4', name: 'Core & Flexibility', duration: 30, difficulty: 'beginner', caloriesBurned: 150 },
    { id: 'w5', name: 'Running', duration: 40, difficulty: 'intermediate', caloriesBurned: 400 },
  ],
};

export const MOCK_CHAT_MESSAGES = [
  { id: '1', text: 'Hi! How can I help you with your nutrition or workout today?', isUser: false, timestamp: new Date() },
  { id: '2', text: 'What are some high-protein breakfast options?', isUser: true, timestamp: new Date() },
  { id: '3', text: 'Great question! Here are some excellent high-protein breakfast ideas: 1) Greek yogurt with nuts and honey, 2) Scrambled eggs with spinach, 3) Protein smoothie with banana and peanut butter. Would you like detailed recipes for any of these?', isUser: false, timestamp: new Date() },
];
