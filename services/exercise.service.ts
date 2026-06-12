import { ExerciseDetail } from "../types/exercise";
import { api } from "./api";

export const exerciseService = {
    /**
     * Fetch exercise detail from API
     */
    async getExerciseDetail(exerciseId: number): Promise<ExerciseDetail> {
        try {
        const { data } = await api.get<ExerciseDetail>(`/exercises/${exerciseId}`);
        return data;
        } catch (error) {
        console.error('Error fetching exercise detail:', error);
        throw error;
        }
    },

    
}