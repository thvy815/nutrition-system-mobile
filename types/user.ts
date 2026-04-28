export type FitnessLevel = 'sedentary' | 'beginner' | 'intermediate' | 'advanced' | 'athlete';

export type HealthGoal = 'lose_weight' | 'gain_weight' | 'maintain_weight';

export interface UserProfile {
  name: string;
  email: string;
  isEmailVerified: boolean;

  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;

  fitnessLevel: FitnessLevel;
  healthGoal: HealthGoal;
  dietaryRestrictions: string[];
}