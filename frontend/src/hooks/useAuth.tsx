
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, loginUser, registerUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>; // Changed email to username
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>; // Added username, renamed name to fullName
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => { // Changed email to username
    try {
      setIsLoading(true);
      // loginUser from api.ts returns an object like { message: string, user: User }
      const response = await loginUser(username, password); // Changed email to username
      setUser(response.user); // Set the actual user object
      localStorage.setItem('user', JSON.stringify(response.user));
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.full_name || response.user.username}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, fullName: string) => {
    // registerUser from api.ts returns { message: string }, not the user object
    try {
      setIsLoading(true);
      // Corrected arguments for registerUser: username, password, email, full_name
      await registerUser(username, password, email, fullName); 
      // Do not set user or localStorage here, user needs to login after registration
      toast({
        title: "Registration successful",
        description: `Welcome, ${fullName || username}! Please log in to continue.`,
      });
      // Optionally, navigate to login page or clear form, etc.
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
