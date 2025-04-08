// Auth types
export type UserType = 'artist' | 'venue' | 'fan';

export interface User {
  id: number;
  name: string;
  email: string;
  userType: UserType;
  role: string;
  venueId?: number | null;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
}