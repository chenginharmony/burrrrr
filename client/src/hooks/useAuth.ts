import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  username?: string;
  availablePoints?: number;
  totalEarnings?: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          // Unauthorized - user not logged in
          setUser(null);
          setIsAuthenticated(false);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Check for auth error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auth_error')) {
      console.error('Authentication failed');
      setIsLoading(false);
      return;
    }

    checkAuth();
  }, []);

  const login = () => {
    window.location.href = '/api/login';
  };

  const logout = () => {
    window.location.href = '/api/logout';
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};