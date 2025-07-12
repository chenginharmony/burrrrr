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
        // Use Supabase client session
        const { data, error } = await import("../supabaseClient").then(m => m.supabase.auth.getUser());
        if (data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || "",
            firstName: data.user.user_metadata?.firstName || "",
            lastName: data.user.user_metadata?.lastName || "",
            profileImageUrl: data.user.user_metadata?.avatar_url,
            username: data.user.user_metadata?.username,
          });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = () => {
    window.location.href = '/login';
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