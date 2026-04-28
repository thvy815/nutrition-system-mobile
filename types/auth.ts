export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goal?: string;
  allergies?: string[];
  fitnessLevel?: string;
  isEmailVerified?: boolean;
}

export interface LoginSuccessResponse {
  message: string;
  token: string;
  user: LoginUser;
  requiresEmailVerification?: boolean;
}

export interface LoginErrorResponse {
  message: string;
}
