import type { Meal, Workout, FoodAnalysisResult, RecipeAnalysisResult, UserProfile } from '../types';

export const MOCK_USER_PROFILE: UserProfile = {
  age: 28,
  gender: 'male',
  height: 175,
  weight: 75,
  activityLevel: 'moderate',
  healthGoal: 'build_muscle',
  dietaryRestrictions: ['không gluten'],
};

export const MOCK_DASHBOARD = {
  dailyCalorieTarget: 2200,
  caloriesConsumed: 1450,
  caloriesBurned: 320,
  weight: 75,
  bmi: 24.5,
  todayMeals: [
    { id: '1', name: 'Sữa chua Hy Lạp với quả mọng', calories: 280, protein: 18, carbs: 32, fat: 8, timeOfDay: 'breakfast' as const },
    { id: '2', name: 'Salad gà nướng', calories: 420, protein: 35, carbs: 22, fat: 22, timeOfDay: 'lunch' as const },
    { id: '3', name: 'Cá hồi với hạt diêm mạch', calories: 550, protein: 42, carbs: 45, fat: 22, timeOfDay: 'dinner' as const },
    { id: '4', name: 'Sinh tố protein', calories: 200, protein: 25, carbs: 8, fat: 2, timeOfDay: 'snack' as const },
  ] as Meal[],
  todayWorkouts: [
    { id: '1', name: 'Thể lực phần trên', duration: 45, difficulty: 'intermediate' as const, caloriesBurned: 280 },
    { id: '2', name: 'Đi bộ buổi tối', duration: 20, difficulty: 'beginner' as const, caloriesBurned: 90 },
  ] as Workout[],
};

export const MOCK_FOOD_ANALYSIS: FoodAnalysisResult = {
  foodName: 'Salad Caesar gà nướng',
  ingredients: ['Ức gà', 'Rau xà lách Romaine', 'Phô mai Parmesan', 'Sốt Caesar', 'Bánh mì nướng giòn'],
  calories: 485,
  protein: 42,
  carbs: 18,
  fat: 28,
};

export const MOCK_RECIPE_ANALYSIS: RecipeAnalysisResult = {
  ingredients: [
    { name: 'Ức gà (200g)', calories: 330, protein: 62, carbs: 0, fat: 7 },
    { name: 'Gạo lứt (150g)', calories: 165, protein: 4, carbs: 34, fat: 1 },
    { name: 'Bông cải xanh (100g)', calories: 34, protein: 3, carbs: 7, fat: 0 },
    { name: 'Dầu ô liu (1 thìa)', calories: 120, protein: 0, carbs: 0, fat: 14 },
  ],
  totalCalories: 649,
  totalProtein: 69,
  totalCarbs: 41,
  totalFat: 22,
};

export const MOCK_MEAL_RECOMMENDATIONS: { daily: Meal[]; weekly: Meal[] } = {
  daily: [
    { id: '1', name: 'Cháo yến mạch với chuối', calories: 350, protein: 12, carbs: 58, fat: 8, goalTag: 'build_muscle' },
    { id: '2', name: 'Cuộn gà tây', calories: 420, protein: 28, carbs: 45, fat: 14, goalTag: 'build_muscle' },
    { id: '3', name: 'Bò xào rau củ', calories: 520, protein: 38, carbs: 42, fat: 22, goalTag: 'build_muscle' },
    { id: '4', name: 'Parfait sữa chua Hy Lạp', calories: 220, protein: 15, carbs: 28, fat: 6, goalTag: 'build_muscle' },
  ],
  weekly: [
    { id: 'w1', name: 'Trứng Benedict', calories: 450, protein: 22, carbs: 28, fat: 28, goalTag: 'build_muscle' },
    { id: 'w2', name: 'Bowl Địa Trung Hải', calories: 480, protein: 25, carbs: 52, fat: 20, goalTag: 'build_muscle' },
    { id: 'w3', name: 'Cá hồi nướng', calories: 520, protein: 45, carbs: 15, fat: 32, goalTag: 'build_muscle' },
    { id: 'w4', name: 'Bowl gà Buddha', calories: 420, protein: 35, carbs: 48, fat: 12, goalTag: 'build_muscle' },
    { id: 'w5', name: 'Bowl cá ngừ Poke', calories: 480, protein: 42, carbs: 42, fat: 18, goalTag: 'build_muscle' },
  ],
};

export const MOCK_WORKOUT_RECOMMENDATIONS: { daily: Workout[]; weekly: Workout[] } = {
  daily: [
    { id: '1', name: 'Ngày đẩy - Ngực & Tay sau', duration: 50, difficulty: 'intermediate', caloriesBurned: 320 },
    { id: '2', name: 'Cardio HIIT', duration: 25, difficulty: 'advanced', caloriesBurned: 280 },
  ],
  weekly: [
    { id: 'w1', name: 'Thể lực toàn thân', duration: 60, difficulty: 'intermediate', caloriesBurned: 380 },
    { id: 'w2', name: 'Ngày tập chân', duration: 45, difficulty: 'advanced', caloriesBurned: 350 },
    { id: 'w3', name: 'Ngày kéo - Lưng & Tay trước', duration: 50, difficulty: 'intermediate', caloriesBurned: 300 },
    { id: 'w4', name: 'Core & Dẻo dai', duration: 30, difficulty: 'beginner', caloriesBurned: 150 },
    { id: 'w5', name: 'Chạy bộ', duration: 40, difficulty: 'intermediate', caloriesBurned: 400 },
  ],
};

export const MOCK_CHAT_MESSAGES = [
  { id: '1', text: 'Xin chào! Tôi có thể giúp gì cho bạn về dinh dưỡng hay tập luyện hôm nay?', isUser: false, timestamp: new Date() },
  { id: '2', text: 'Có những món ăn sáng giàu đạm nào?', isUser: true, timestamp: new Date() },
  { id: '3', text: 'Câu hỏi hay! Đây là một số gợi ý bữa sáng giàu đạm: 1) Sữa chua Hy Lạp với hạt và mật ong, 2) Trứng bác với rau chân vịt, 3) Sinh tố protein với chuối và bơ đậu phộng. Bạn có muốn công thức chi tiết không?', isUser: false, timestamp: new Date() },
];
