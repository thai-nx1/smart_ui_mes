// Define the user type
export interface User {
  id: number;
  username: string;
  email: string;
  sso_type: string;
}

// Define the auth context state
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}