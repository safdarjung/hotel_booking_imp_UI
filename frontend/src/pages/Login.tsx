
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import AnimatedTransition from '@/components/ui/AnimatedTransition';

const Login = () => {
  const [username, setUsername] = useState(''); // Changed email to username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) { // Changed email to username
      setError('Please enter your username and password'); // Changed email to username
      return;
    }

    try {
      await login(username, password); // Changed email to username
      navigate(from, { replace: true });
    } catch (error) {
      setError('Invalid credentials');
    }
  };

  // For demo purposes, easy login with demo account
  const handleDemoLogin = async () => {
    try {
      // Assuming 'demouser' is a valid username for demo purposes
      await login('demouser', 'password'); 
      navigate(from, { replace: true });
    } catch (error) {
      setError('Error logging in with demo account');
    }
  };

  return (
    <AnimatedTransition>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to continue to LuxeStay</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700"> 
                Username
              </label>
              <Input
                id="username" // Changed id
                type="text" // Changed type
                placeholder="yourusername" // Changed placeholder
                value={username} // Changed value
                onChange={(e) => setUsername(e.target.value)} // Changed setter
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm text-hotel-600 hover:text-hotel-800">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDemoLogin}
            >
              Try with demo account
            </Button>
          </div>

          <div className="mt-6 text-center text-gray-600 text-sm">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-hotel-600 hover:text-hotel-800 font-medium">
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatedTransition>
  );
};

export default Login;
