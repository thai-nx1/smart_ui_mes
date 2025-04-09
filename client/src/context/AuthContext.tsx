import * as React from 'react';
import { useQuery } from "@tanstack/react-query";

// Define the user type
export interface User {
  id: number;
  username: string;
  email: string;
  sso_type: string;
}

// Define the auth context state
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}

// Create the auth context
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // State to hold the user data
  const [user, setUser] = React.useState<User | null>(null);
  
  // Define the response type from the auth endpoint
  interface AuthResponse {
    isAuthenticated: boolean;
    user: User | null;
  }

  // Query for fetching the current user
  const { data: authData, isLoading, refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/user'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
  
  // Update user state when auth data changes
  React.useEffect(() => {
    if (authData?.isAuthenticated && authData.user) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, [authData]);
  
  // Logout function
  const logout = React.useCallback(() => {
    window.location.href = '/api/auth/logout';
  }, []);
  
  // Refresh user data
  const refreshUser = React.useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Create the context value
  const value = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refreshUser,
  }), [user, isLoading, logout, refreshUser]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}