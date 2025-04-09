import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";

// Define the user type
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
  refreshUser: () => {},
});

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth provider component
export function AuthProvider({ children }) {
  // State to hold the user data
  const [user, setUser] = useState(null);
  
  // Query for fetching the current user
  const { data: authData, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
  
  // Update user state when auth data changes
  useEffect(() => {
    if (authData?.isAuthenticated && authData.user) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, [authData]);
  
  // Logout function
  const logout = useCallback(() => {
    window.location.href = '/api/auth/logout';
  }, []);
  
  // Refresh user data
  const refreshUser = useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Create the context value
  const value = useMemo(() => ({
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