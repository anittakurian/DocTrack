import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Stethoscope, Lock, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-50 via-teal-50/20 to-emerald-50/30 dark:from-slate-950 dark:via-teal-950/10 dark:to-emerald-950/20 p-4 font-sans">
      <div className="w-full max-w-md animate-slide-up">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-medical-600 flex items-center justify-center text-white shadow-md shadow-medical-500/20 mb-3">
            <Stethoscope size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">DocTrack</h1>
          <p className="text-sm text-muted-foreground mt-1">Patient Data Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-border bg-card/75 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Welcome Doctor</CardTitle>
            <CardDescription>Enter your credentials to access your patient panel</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-fade-in">
                  {error}
                </div>
              )}
              
              <div className="relative">
                <Input
                  id="username"
                  label="Username"
                  placeholder="dr_sravan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                />
                <UserIcon className="absolute left-3 bottom-3 text-muted-foreground" size={16} />
              </div>

              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
                <Lock className="absolute left-3 bottom-3 text-muted-foreground" size={16} />
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button type="submit" className="w-full py-2.5" loading={loading}>
                Sign In
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-medical-600 hover:text-medical-700 font-semibold transition-colors duration-150">
                  Register here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
