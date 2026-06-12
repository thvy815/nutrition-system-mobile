export interface ExercisePreview {
  exerciseId: number;
  name: string;
  duration: number; // minutes
}

export interface ExerciseMuscle {
  id: number;
  name: string;
  name_en: string;
  _id?: string;
}

export interface ExerciseDetail {
  _id: string;
  exerciseId: number;
  name: string;
  description: string;
  category: string;
  categoryId: number;
  equipment: Array<{
    id: number;
    name: string;
    _id?: string;
  }>;
  images: string[];
  muscles: ExerciseMuscle[];
  muscles_secondary: ExerciseMuscle[];
  videos: string[];
  activityType: string;
  defaultIntensity: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseDetailResponse {
  success?: boolean;
  data?: ExerciseDetail;
}