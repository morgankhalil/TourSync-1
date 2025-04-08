// Auth types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  venueId?: number | null;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}