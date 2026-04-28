/**
 * Mock Data for Workout Feature
 * Use this for testing when API is not available
 */

import { WorkoutPlan } from '../types/workout';

export const MOCK_WORKOUT_PLAN: WorkoutPlan = {
  userId: '69a444e98e04aff72f8d9584',
  workoutLevel: 'beginner',
  targetCalories: 150,
  generatedAt: '2026-04-13T05:10:44.562Z',
  plan: [
    {
      day: 1,
      type: 'workout',
      muscleGroup: 'full_body',
      targetCalories: 150,
      exercises: [
        {
          exerciseId: 923,
          name: 'LYING DUMBBELL ROW SS SEATED SHRUG',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 189,
          name: 'Deficit Deadlift',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 206,
          name: 'Dumbbell Lunges Walking',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 914,
          name: 'Reverse EZ Bar Cable Curls',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
      ],
    },
    {
      day: 2,
      type: 'workout',
      muscleGroup: 'full_body',
      targetCalories: 150,
      exercises: [
        {
          exerciseId: 185,
          name: 'Decline Bench Press Barbell',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 193,
          name: 'Diagonal Shoulder Press',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 167,
          name: 'Crunches',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 203,
          name: 'Dumbbell Goblet Squat',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
      ],
    },
    {
      day: 3,
      type: 'workout',
      muscleGroup: 'full_body',
      targetCalories: 150,
      exercises: [
        {
          exerciseId: 161,
          name: 'Cross-Bench Dumbbell Pullovers',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 184,
          name: 'Deadlifts',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 186,
          name: 'Decline Bench Press Dumbbell',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
        {
          exerciseId: 238,
          name: 'Fly With Dumbbells',
          sets: 3,
          reps: '10-12',
          duration: 7.5,
          calories: 28,
        },
      ],
    },
    {
      day: 4,
      type: 'rest',
    },
    {
      day: 5,
      type: 'rest',
    },
    {
      day: 6,
      type: 'rest',
    },
    {
      day: 7,
      type: 'rest',
    },
  ],
};

/**
 * HOW TO USE MOCK DATA
 * 
 * Option 1: In WorkoutContext.tsx fetchPlan()
 * return MOCK_WORKOUT_PLAN; // Instead of calling API
 * 
 * Option 2: In services/workout.ts getWorkoutPlan()
 * Add condition:
 * if (USE_MOCK_DATA) {
 *   return MOCK_WORKOUT_PLAN;
 * }
 * 
 * Option 3: Replace API call in App startup
 * 
 * Set USE_MOCK_DATA = true for development/testing
 * Set USE_MOCK_DATA = false for production
 */

export const USE_MOCK_DATA = false; // Toggle during development
