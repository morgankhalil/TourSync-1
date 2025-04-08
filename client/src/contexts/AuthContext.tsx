import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Types
type UserType = 'artist' | 'venue' | 'fan';

interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  venueId?: number;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType: UserType;
  existingVenueId?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => Promise.resolve(false),
  register: () => Promise.resolve(false),
  logout: () => Promise.resolve(),
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.user) {
          const userData = response.data.user;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));

          // If user is a venue user and has a venueId, update the activeVenueId
          if (userData.userType === 'venue' && userData.venueId) {
            localStorage.setItem('activeVenueId', userData.venueId.toString());
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('activeVenueId');
        }
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to check authentication status:', error);
        }
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('activeVenueId');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/register', data);
      if (response.status === 201 && response.data.user) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Context hook
export const useAuth = () => useContext(AuthContext);