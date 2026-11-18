/**
 * Dữ liệu mẫu cho chế độ demo (EXPO_PUBLIC_DEMO=1).
 * Trả về đúng định dạng response của backend để chụp UI / demo khi không có server.
 * KHÔNG được import trực tiếp ở nơi khác ngoài services/api.ts.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function vnDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

const TODAY = vnDate(0);

/* ------------------------------------------------------------------ */
/* Workout plan                                                        */
/* ------------------------------------------------------------------ */

const EX = {
  pushup: { exerciseId: 101, name: 'Hít đất (Push-up)', sets: 3, reps: '10-12', duration: 8, calories: 45, intensity: 'moderate' },
  incline: { exerciseId: 102, name: 'Đẩy ngực dốc lên với tạ đơn', sets: 3, reps: '8-10', duration: 10, calories: 55, intensity: 'moderate' },
  shoulder: { exerciseId: 103, name: 'Đẩy vai với tạ đơn', sets: 3, reps: '10', duration: 8, calories: 40, intensity: 'moderate' },
  dips: { exerciseId: 104, name: 'Chống đẩy trên ghế (Bench dips)', sets: 3, reps: '12', duration: 6, calories: 35, intensity: 'light' },
  squat: { exerciseId: 201, name: 'Squat với trọng lượng cơ thể', sets: 4, reps: '15', duration: 10, calories: 60, intensity: 'moderate' },
  lunge: { exerciseId: 202, name: 'Chùng chân (Lunge)', sets: 3, reps: '12 mỗi bên', duration: 9, calories: 50, intensity: 'moderate' },
  row: { exerciseId: 301, name: 'Kéo tạ đơn một tay', sets: 3, reps: '10', duration: 9, calories: 48, intensity: 'moderate' },
  plank: { exerciseId: 401, name: 'Plank', sets: 3, reps: '45 giây', duration: 6, calories: 25, intensity: 'light' },
} as const;

function day(
  n: number,
  type: 'workout' | 'rest',
  focus: string,
  exercises: any[],
  extra: Record<string, any> = {}
) {
  const offset = n - 3; // ngày 3 là hôm nay
  return {
    day: n,
    date: `${vnDate(offset)}T00:00:00.000Z`,
    type,
    focus,
    dailyTargetCalories: 250,
    estimatedCalories: exercises.reduce((s, e) => s + e.calories, 0),
    totalDuration: exercises.reduce((s, e) => s + e.duration, 0),
    estimatedDifficulty: 5,
    completed: offset < 0 && type === 'workout',
    skipped: false,
    exerciseDetails: exercises,
    substitutions: [],
    ...extra,
  };
}

let PLAN: any = {
  _id: 'plan-demo',
  userId: 'user-demo',
  workoutLevel: 'intermediate',
  currentWeek: 3,
  weekStartDate: `${vnDate(-2)}T00:00:00.000Z`,
  weekEndDate: `${vnDate(4)}T00:00:00.000Z`,
  weeklyTargetCalories: 1200,
  weeklyEstimatedCalories: 1050,
  fatigueScore: 3.8,
  recoveryScore: 7.2,
  avgPerformanceScore: 6.9,
  readinessScore: 7.1,
  generatedAt: new Date().toISOString(),
  isActive: true,
  days: [
    day(1, 'workout', 'push', [EX.pushup, EX.shoulder, EX.dips]),
    day(2, 'workout', 'legs', [EX.squat, EX.lunge, EX.plank]),
    day(3, 'workout', 'push', [EX.pushup, EX.incline, EX.shoulder, EX.dips], {
      adaptation: {
        action: 'increase',
        reasons: [
          'Readiness 7.1/10 và Recovery 7.2: cơ thể hồi phục tốt.',
          'Hoàn thành 100% buổi tập tuần này: tăng nhẹ khối lượng.',
        ],
        appliedAt: new Date().toISOString(),
      },
    }),
    day(4, 'rest', 'recovery', []),
    day(5, 'workout', 'pull', [EX.row, EX.plank, EX.lunge], {
      substitutions: [
        { fromExerciseId: 305, fromName: 'Hít xà đơn', toExerciseId: 301, toName: 'Kéo tạ đơn một tay', reason: 'no_equipment' },
      ],
    }),
    day(6, 'workout', 'legs', [EX.squat, EX.lunge]),
    day(7, 'rest', 'recovery', []),
  ],
};

const TRAINING_STATE = {
  fatigueScore: 3.8,
  recoveryScore: 7.2,
  performanceScore: 6.9,
  readinessScore: 7.1,
  status: 'ready',
  recommendedIntensity: 'moderate',
  isColdStart: false,
  breakdown: {
    fatigue: {
      score: 3.8,
      components: { training: 4.2, dailyActivity: 3.1 },
      usedWeights: { training: 0.65, dailyActivity: 0.35 },
      details: { acuteLoad: 820, referenceLoad: 760, workloadRatio: 1.08, sessionsLast7Days: 6 },
    },
    recovery: {
      score: 7.2,
      components: { sleep: 7.8, timeSinceHardSession: 6.5, restDays: 7 },
      usedWeights: { sleep: 0.45, timeSinceHardSession: 0.35, restDays: 0.2 },
    },
    performance: {
      score: 6.9,
      components: { avgPerformance: 6.4, completionRate: 9.0, trend: 5.5 },
      usedWeights: { avgPerformance: 0.5, completionRate: 0.3, trend: 0.2 },
    },
  },
  dataAvailability: { completedExercises28d: 31, trainingDays28d: 11, healthCoverage7d: 0.86, googleSync: 'ok' },
};

/* ------------------------------------------------------------------ */
/* Google Health                                                        */
/* ------------------------------------------------------------------ */

const DAILY = [
  [6420, 1980, 34, 22, 6, 412],
  [8930, 2210, 52, 35, 12, 385],
  [4210, 1890, 21, 15, 2, 455],
  [10350, 2380, 64, 41, 18, 428],
  [7720, 2105, 46, 30, 9, 396],
  [5480, 1950, 28, 20, 4, 470],
  [7860, 2140, 42, 28, 11, 438],
].map(([steps, cal, active, mod, vig, sleep], i) => ({
  date: vnDate(i - 6),
  steps,
  caloriesBurned: cal,
  activeMinutes: active,
  moderateMinutes: mod,
  vigorousMinutes: vig,
  sleepMinutes: sleep,
  source: 'google_health',
}));

const avg = (k: keyof (typeof DAILY)[number]) =>
  Math.round(DAILY.reduce((s, d) => s + (d[k] as number), 0) / DAILY.length);

const SUMMARY = {
  from: DAILY[0].date,
  to: TODAY,
  days: 7,
  metrics: {
    steps: { avg: avg('steps'), daysWithData: 7 },
    caloriesBurned: { avg: avg('caloriesBurned'), daysWithData: 7 },
    activeMinutes: { avg: avg('activeMinutes'), daysWithData: 7 },
    moderateMinutes: { avg: avg('moderateMinutes'), daysWithData: 7 },
    vigorousMinutes: { avg: avg('vigorousMinutes'), daysWithData: 7 },
    sleepMinutes: { avg: avg('sleepMinutes'), daysWithData: 7 },
  },
  coverage: 1,
  daily: [...DAILY].reverse(),
};

const STATUS = {
  connected: true,
  status: 'active',
  scopes: [],
  grantedMetrics: ['steps', 'caloriesBurned', 'activeMinutes', 'sleep'],
  connectedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  lastSyncedAt: new Date(Date.now() - 25 * 60000).toISOString(),
};

const WHO = {
  window: { from: DAILY[0].date, to: TODAY, days: 7 },
  profile: { age: 22, fitnessLevel: 'intermediate', group: 'adult' },
  comparison: {
    supported: true,
    group: 'adult',
    label: 'Người trưởng thành (18–64 tuổi)',
    aerobic: {
      unit: 'minutes/week',
      actual: 262,
      target: { min: 150, max: 300 },
      status: 'within',
      gap: 0,
      measure: { daysWithData: 7, windowDays: 7, estimated: false, includesLight: false },
    },
    strength: { unit: 'days/week', actual: 1, target: { min: 2 }, status: 'below', gap: 1 },
    balance: null,
    steps: { average: avg('steps'), daysWithData: 7 },
    notes: [],
  },
  recommendations: [
    {
      type: 'aerobic_maintain',
      priority: 2,
      title: 'Bạn đạt 262 phút vận động tương đương mức vừa/tuần, nằm trong khuyến nghị 150–300 phút. Hãy duy trì.',
      sourceKeys: ['who-2020'],
    },
    {
      type: 'strength',
      priority: 1,
      title: 'Thêm 1 buổi tập tăng cơ toàn thân (các nhóm cơ lớn) mỗi tuần.',
      sourceKeys: ['who-2020', 'acsm'],
      exercises: [
        { exerciseId: 201, name: 'Squat' },
        { exerciseId: 101, name: 'Hít đất' },
        { exerciseId: 301, name: 'Kéo tạ đơn' },
      ],
    },
    {
      type: 'steps_info',
      priority: 3,
      title: `Trung bình ${avg('steps').toLocaleString('vi-VN')} bước/ngày: chỉ để theo dõi, số bước không phải chỉ tiêu của WHO.`,
      sourceKeys: [],
    },
  ],
  sources: [
    {
      key: 'who-2020',
      title: 'WHO guidelines on physical activity and sedentary behaviour',
      org: 'WHO',
      year: 2020,
      section: 'Adults aged 18–64 years',
      url: 'https://www.who.int/publications/i/item/9789240015128',
    },
    {
      key: 'acsm',
      title: "ACSM's Guidelines for Exercise Testing and Prescription",
      org: 'ACSM',
      year: 2021,
      section: 'Resistance training',
    },
  ],
  citationsAvailable: true,
  disclaimer: 'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia.',
};

/* ------------------------------------------------------------------ */
/* Meals                                                               */
/* ------------------------------------------------------------------ */

const recipe = (id: string, name: string, servingTime: string, cal: number, p: number, c: number, f: number, checked = false) => ({
  _id: id,
  recipeId: `r-${id}`,
  name,
  servingTime,
  scale: 1,
  isChecked: checked,
  imageUrl: undefined,
  nutrition: { calories: cal, protein: p, carbs: c, fat: f },
});

const MENU = {
  _id: 'menu-demo',
  date: `${TODAY}T00:00:00.000Z`,
  status: 'selected',
  recipes: [
    recipe('m1', 'Phở bò tái', 'breakfast', 430, 24, 55, 12, true),
    recipe('m2', 'Cơm gạo lứt, ức gà áp chảo', 'lunch', 560, 42, 62, 14, true),
    recipe('m3', 'Canh bí đỏ nấu tôm', 'lunch', 120, 9, 14, 3),
    recipe('m4', 'Cá hồi nướng, salad rau', 'dinner', 480, 34, 18, 28),
    recipe('m5', 'Sữa chua Hy Lạp & chuối', 'snack', 190, 12, 28, 3),
  ],
  totalNutrition: { calories: 1780, protein: 121, carbs: 177, fat: 60 },
  targetNutrition: { calories: 2000, protein: 120, carbs: 230, fat: 65 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

const CHAT_SESSIONS = [
  { _id: 's1', title: 'Vận động bao nhiêu là đủ?', messages: [], isActive: true, createdAt: '', updatedAt: '' },
  { _id: 's2', title: 'Thực đơn giảm cân', messages: [], isActive: true, createdAt: '', updatedAt: '' },
  { _id: 's3', title: 'Ăn bao nhiêu muối mỗi ngày', messages: [], isActive: true, createdAt: '', updatedAt: '' },
];

const CHAT_ANSWER = {
  sessionId: 's1',
  message: {
    role: 'model',
    content:
      'Theo khuyến nghị của WHO, người trưởng thành (18–64 tuổi) nên:\n\n' +
      '- **150–300 phút/tuần** hoạt động aerobic cường độ vừa, **hoặc 75–150 phút/tuần** cường độ mạnh [S1].\n' +
      '- Tập **tăng cơ ≥ 2 ngày/tuần** cho các nhóm cơ lớn [S1][S2].\n' +
      '- Hạn chế thời gian ngồi lâu; vận động nhẹ cũng có lợi [S1].\n\n' +
      'Tuần này bạn đạt khoảng **262 phút**, đã nằm trong khuyến nghị. Hãy thêm 1 buổi tập tăng cơ nhé!\n\n' +
      'Nguồn tham khảo:\n[S1] WHO 2020\n[S2] ACSM 2021',
    disclaimer: 'Thông tin chỉ mang tính tham khảo. Vui lòng tham khảo chuyên gia dinh dưỡng hoặc bác sĩ.',
    hasDisclaimer: true,
    dataSource: 'hybrid',
    citations: [
      {
        id: 'S1',
        title: 'WHO guidelines on physical activity and sedentary behaviour',
        org: 'WHO',
        year: 2020,
        section: 'Adults aged 18–64 years',
        url: 'https://www.who.int/publications/i/item/9789240015128',
      },
      { id: 'S2', title: "ACSM's Guidelines for Exercise Testing and Prescription", org: 'ACSM', year: 2021, section: 'Resistance training' },
    ],
    grounding: { checked: true, action: 'passed', passed: true, supportRatio: 1, warnings: 0 },
  },
  toolsUsed: [{ name: 'rag_retrieve', success: true }, { name: 'get_activity_vs_who', success: true }],
};

/* ------------------------------------------------------------------ */
/* Food detection                                                       */
/* ------------------------------------------------------------------ */

const DISH_DB: Record<string, any> = {
  'Cơm trắng': {
    name: 'Cơm trắng',
    servings: 1,
    totalNutritionPerServing: { calories: 260, protein: 5, carbs: 57, fat: 0.5 },
    ingredients: [{ _id: 'i1', name: 'Gạo tẻ', quantity: { amount: 75, unit: 'g' } }],
  },
  'Thịt kho trứng': {
    name: 'Thịt kho trứng',
    servings: 1,
    totalNutritionPerServing: { calories: 410, protein: 24, carbs: 9, fat: 31 },
    ingredients: [
      { _id: 'i2', name: 'Thịt ba chỉ', quantity: { amount: 100, unit: 'g' } },
      { _id: 'i3', name: 'Trứng vịt', quantity: { amount: 1, unit: 'quả' } },
      { _id: 'i4', name: 'Nước dừa', quantity: { amount: 100, unit: 'ml' } },
      { _id: 'i5', name: 'Nước mắm', quantity: { amount: 10, unit: 'ml' } },
    ],
  },
  'Canh chua cá lóc': {
    name: 'Canh chua cá lóc',
    servings: 1,
    totalNutritionPerServing: { calories: 165, protein: 19, carbs: 11, fat: 5 },
    ingredients: [
      { _id: 'i6', name: 'Cá lóc', quantity: { amount: 100, unit: 'g' } },
      { _id: 'i7', name: 'Dứa', quantity: { amount: 50, unit: 'g' } },
      { _id: 'i8', name: 'Cà chua', quantity: { amount: 50, unit: 'g' } },
      { _id: 'i9', name: 'Giá đỗ', quantity: { amount: 30, unit: 'g' } },
    ],
  },
};

/* ------------------------------------------------------------------ */

const ok = <T>(data: T, status = 200) => ({ data, status });
const wrap = <T>(data: T) => ok({ success: true, data });

export async function demoRequest(method: string, endpoint: string, body?: any) {
  await delay(endpoint.includes('detect-food') ? 900 : endpoint.includes('/chat/message') ? 1200 : 250);
  const path = endpoint.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '').split('?')[0];
  const query = new URLSearchParams(endpoint.split('?')[1] || '');

  // Auth
  if (path === '/auth/login') {
    return ok({
      message: 'ok',
      token: 'demo-token',
      user: { _id: 'user-demo', name: 'Nguyễn Minh An', email: 'demo@example.com', role: 'user', age: 22, isEmailVerified: true },
    });
  }
  if (path === '/auth/me') {
    return ok({
      _id: 'user-demo', name: 'Nguyễn Minh An', email: 'demo@example.com', role: 'user',
      age: 22, gender: 'female', height: 160, weight: 52, goal: 'maintain_weight',
      fitnessLevel: 'intermediate', allergies: ['Đậu phộng'], isEmailVerified: true,
    });
  }

  // Workout
  if (path === '/workout-plan/current') return wrap(PLAN);
  if (path === '/workout-plan/today') return wrap(PLAN.days[2]);
  if (path === '/workout-plan/training-state') return wrap(TRAINING_STATE);
  if (path === '/workout-plan/adapt') {
    const result = {
      dryRun: query.get('dryRun') === 'true',
      decision: {
        action: 'increase',
        reasons: [
          'Readiness 7.1/10 (sẵn sàng), Fatigue thấp 3.8/10.',
          'Ngủ trung bình 7g18 trong 7 ngày qua: phục hồi tốt.',
          'Đã hoàn thành 2/2 buổi tập của tuần: đủ điều kiện tăng nhẹ.',
        ],
        lowAdherence: false,
      },
      state: { status: 'ready', readinessScore: 7.1, fatigueScore: 3.8, recoveryScore: 7.2, performanceScore: 6.9, isColdStart: false },
      activity: { today: { activeMinutes: 42, steps: 7860, sleepMinutes: 438 }, weeklyActiveMinutes: 287, whoWeeklyMinutes: { min: 150, max: 300 } },
      weekProgress: { workoutDays: 5, completedWorkoutDays: 2, skippedWorkoutDays: 0 },
      changes: [
        { day: 5, date: PLAN.days[4].date, action: 'increase', from: { type: 'workout', intensity: 'moderate', exercises: 3 }, to: { type: 'workout', intensity: 'vigorous', exercises: 4 } },
        { day: 6, date: PLAN.days[5].date, action: 'increase', from: { type: 'workout', intensity: 'moderate', exercises: 2 }, to: { type: 'workout', intensity: 'moderate', exercises: 3 } },
      ],
      plan: PLAN,
    };
    return wrap(result);
  }
  const alt = path.match(/^\/workout-plan\/day\/(\d+)\/exercises\/(\d+)\/alternatives$/);
  if (alt) {
    const d = PLAN.days.find((x: any) => x.day === Number(alt[1]));
    const orig = d?.exerciseDetails.find((e: any) => e.exerciseId === Number(alt[2]));
    return wrap({
      day: Number(alt[1]),
      canReplace: true,
      blockedReason: null,
      reason: query.get('reason') || 'too_hard',
      original: { ...orig, difficulty: 'intermediate', primaryGroups: ['chest', 'triceps'] },
      alternatives: [
        { exerciseId: 110, name: 'Hít đất tựa gối (Knee push-up)', difficulty: 'beginner', equipment: [], primaryGroups: ['chest'], calories: 35, similarity: 0.92 },
        { exerciseId: 111, name: 'Hít đất tựa tường (Wall push-up)', difficulty: 'beginner', equipment: [], primaryGroups: ['chest'], calories: 28, similarity: 0.86 },
        { exerciseId: 112, name: 'Ép ngực với dây kháng lực', difficulty: 'beginner', equipment: ['Dây kháng lực'], primaryGroups: ['chest'], calories: 38, similarity: 0.81 },
        { exerciseId: 113, name: 'Đẩy ngực nằm với tạ đơn', difficulty: 'intermediate', equipment: ['Tạ đơn', 'Ghế'], primaryGroups: ['chest', 'triceps'], calories: 52, similarity: 0.78 },
      ],
    });
  }
  const rep = path.match(/^\/workout-plan\/day\/(\d+)\/exercises\/(\d+)\/replace$/);
  if (rep) {
    const dayNo = Number(rep[1]);
    const fromId = Number(rep[2]);
    PLAN = {
      ...PLAN,
      days: PLAN.days.map((d: any) => {
        if (d.day !== dayNo) return d;
        const from = d.exerciseDetails.find((e: any) => e.exerciseId === fromId);
        return {
          ...d,
          exerciseDetails: d.exerciseDetails.map((e: any) =>
            e.exerciseId === fromId
              ? { ...e, exerciseId: body.newExerciseId, name: 'Hít đất tựa gối (Knee push-up)', calories: 35, intensity: 'light' }
              : e
          ),
          substitutions: [
            ...(d.substitutions || []),
            { fromExerciseId: fromId, fromName: from?.name, toExerciseId: body.newExerciseId, toName: 'Hít đất tựa gối (Knee push-up)', reason: body.reason },
          ],
        };
      }),
    };
    return wrap({
      day: dayNo,
      replaced: { from: { exerciseId: fromId, name: 'Hít đất (Push-up)' }, to: { exerciseId: body.newExerciseId, name: 'Hít đất tựa gối (Knee push-up)' }, reason: body.reason },
      dayTotals: { estimatedCalories: 0, totalDuration: 0 },
      plan: PLAN,
    });
  }
  const exd = path.match(/^\/exercises\/(\d+)$/);
  if (exd) {
    const all = Object.values(EX) as any[];
    const e = all.find((x) => x.exerciseId === Number(exd[1])) ?? all[0];
    return ok({
      _id: `ex-${e.exerciseId}`,
      exerciseId: e.exerciseId,
      name: e.name,
      description:
        'Giữ thân người thẳng từ đầu đến gót, siết cơ bụng. Hạ người chậm đến khi ngực gần chạm sàn rồi đẩy lên. Thở ra khi đẩy lên.',
      category: 'Ngực',
      categoryId: 11,
      equipment: [{ id: 7, name: 'Không cần dụng cụ' }],
      images: [
        'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=60&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=60&auto=format&fit=crop',
      ],
      muscles: [{ id: 4, name: 'Pectoralis major', name_en: 'Chest' }],
      muscles_secondary: [{ id: 5, name: 'Triceps brachii', name_en: 'Triceps' }],
      videos: [],
      activityType: 'strength',
      defaultIntensity: 'moderate',
      createdAt: '',
      updatedAt: '',
    });
  }
  if (path === '/workout-session/history') {
    return wrap({
      sessions: [
        { _id: 'ws1', planId: 'plan-demo', day: 2, focus: 'legs', exerciseId: '201', exerciseName: 'Squat với trọng lượng cơ thể', intensity: 'moderate', muscleGroups: ['Đùi trước', 'Mông'], targetSets: 4, targetReps: 15, completedSets: 4, completedReps: 15, durationMinutes: 11, estimatedCalories: 60, actualCalories: 64, perceivedDifficulty: 6, performanceScore: 7.8, fatigueImpact: 0.6, startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 86400000 + 660000).toISOString(), createdAt: '' },
        { _id: 'ws2', planId: 'plan-demo', day: 1, focus: 'push', exerciseId: '101', exerciseName: 'Hít đất (Push-up)', intensity: 'moderate', muscleGroups: ['Ngực', 'Tay sau'], targetSets: 3, targetReps: 12, completedSets: 3, completedReps: 10, durationMinutes: 8, estimatedCalories: 45, actualCalories: 41, perceivedDifficulty: 7, performanceScore: 6.6, fatigueImpact: 0.7, startTime: new Date(Date.now() - 2 * 86400000).toISOString(), endTime: new Date(Date.now() - 2 * 86400000 + 480000).toISOString(), createdAt: '' },
      ],
      pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
  }
  if (path === '/meal-logs') {
    return wrap({
      logs: MENU.recipes.slice(0, 3).map((r, i) => ({
        _id: `log${i}`,
        eatenAt: new Date(Date.now() - i * 5 * 3600000).toISOString(),
        createdAt: '',
        recipe: { name: r.name, imageUrl: null, mealSource: 'daily_menu', nutrition: r.nutrition },
      })),
      pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
    });
  }

  // Google Health
  if (path === '/google-health/status') return wrap(STATUS);
  if (path === '/google-health/activity/summary') {
    const days = Number(query.get('days') || 7);
    return wrap(days === 1 ? { ...SUMMARY, days: 1, daily: [DAILY[DAILY.length - 1]] } : SUMMARY);
  }
  if (path === '/google-health/who-comparison') return wrap(WHO);
  if (path === '/google-health/sync') {
    return wrap({ from: SUMMARY.from, to: TODAY, metrics: { steps: 'ok', caloriesBurned: 'ok', activeMinutes: 'ok', sleep: 'ok', exercise: 'not_granted' }, syncedDays: 7, syncedDates: [] });
  }

  // Meals
  if (path === '/daily-menu/by-date') return wrap(MENU);
  if (path.startsWith('/daily-menu')) return wrap([MENU]);

  // Food detection
  if (path === '/recipes/ai/detect-food') return ok({ foodName: Object.keys(DISH_DB) });
  if (path === '/recipes/search/by-ingredient') {
    const kw = query.get('keyword') || '';
    const hit = DISH_DB[kw];
    return wrap({
      recipes: hit && kw !== 'Canh chua cá lóc' ? [{ _id: kw, ...hit, instructions: [] }] : [],
      pagination: { page: 1, limit: 5, total: hit ? 1 : 0, totalPages: 1 },
    });
  }
  const aiRec = path.match(/^\/recipes\/ai\/recommendations\/(.+)$/);
  if (aiRec) {
    const name = decodeURIComponent(aiRec[1]);
    return ok({ _id: name, ...(DISH_DB[name] ?? DISH_DB['Cơm trắng']), name, instructions: [] });
  }
  if (path.endsWith('/search_batch')) {
    // Canh chua: AI ước tính -> trả dinh dưỡng /100g cho từng nguyên liệu.
    const per100: Record<string, number[]> = {
      'Cá lóc': [97, 18.2, 0, 2.7],
      'Dứa': [29, 0.8, 6.5, 0.2],
      'Cà chua': [20, 0.6, 4, 0.2],
      'Giá đỗ': [44, 5.5, 5.3, 0.2],
    };
    return ok({
      results: (body?.ingredients || []).map((i: any) => {
        const [calories, protein, carbs, fat] = per100[i.name] || [50, 2, 5, 1];
        return { input: i.name, results: [{ id: i.name, mongo_id: i.name, name: i.name, score: 0.9, nutrition: { calories, protein, carbs, fat } }] };
      }),
    });
  }

  // Chat
  if (path === '/chat/sessions') {
    return wrap({ sessions: CHAT_SESSIONS, page: 1, limit: 20, total: 3, totalPages: 1 });
  }
  if (path === '/chat/message/v2') return wrap(CHAT_ANSWER);
  const sess = path.match(/^\/chat\/sessions\/(.+)$/);
  if (sess) {
    return wrap({
      ...CHAT_SESSIONS[0],
      messages: [
        { role: 'user', content: 'Người trưởng thành nên vận động bao nhiêu phút mỗi tuần?' },
        { role: 'model', content: CHAT_ANSWER.message.content, dataSource: 'hybrid' },
      ],
    });
  }

  return wrap(null);
}
