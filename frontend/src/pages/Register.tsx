import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Stethoscope } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { registerUser, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !firstName || !lastName || !password) {
      setError('Please fill in all the required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // 1. Call Register
      await registerUser({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });

      // 2. Auto Login
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      const data = err.response?.data;
      if (data) {
        if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          setError(`${firstKey}: ${data[firstKey][0] || data[firstKey]}`);
        } else {
          setError(data);
        }
      } else {
        setError('Registration failed. Please check details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-50 via-teal-50/20 to-emerald-50/30 dark:from-slate-950 dark:via-teal-950/10 dark:to-emerald-950/20 p-4 font-sans">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-medical-600 flex items-center justify-center text-white shadow-md shadow-medical-500/20 mb-3">
            <Stethoscope size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">DocTrack</h1>
          <p className="text-sm text-muted-foreground mt-1">Patient Data Management System</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-xl border-border bg-card/75 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Create Doctor Profile</CardTitle>
            <CardDescription>Setup your credentials and clinic details to begin</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-fade-in">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  label="First Name *"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  id="lastName"
                  label="Last Name *"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="username"
                  label="Username *"
                  placeholder="dr_johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  id="email"
                  label="Email Address *"
                  type="email"
                  placeholder="john.doe@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="password"
                  label="Password *"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  id="confirmPassword"
                  label="Confirm Password *"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button type="submit" className="w-full py-2.5" loading={loading}>
                Register and Sign In
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-medical-600 hover:text-medical-700 font-semibold transition-colors duration-150">
                  Sign in instead
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
