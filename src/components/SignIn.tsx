import { useState } from 'react';
import { Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Logo from './Logo';
import { login, setDashboardRoleForSession } from '../services/api';

type UserRole = 'hod' | 'coordinator' | 'mentor' | 'staff';

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSignIn: (role: UserRole) => void;
  onForgotPassword: () => void;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  role?: string;
}

export default function SignIn({ onSwitchToSignUp, onSignIn, onForgotPassword }: SignInProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '' as UserRole | '',
    rememberMe: false
  });

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateRole = (role: string): string | undefined => {
    if (!role) return 'Please select your role';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      role: validateRole(formData.role),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    let fieldError: string | undefined;
    switch (field) {
      case 'email':
        fieldError = validateEmail(formData.email);
        break;
      case 'password':
        fieldError = validatePassword(formData.password);
        break;
      case 'role':
        fieldError = validateRole(formData.role);
        break;
    }
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({ email: true, password: true, role: true });

    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        setDashboardRoleForSession(formData.role);
        onSignIn(formData.role as UserRole);
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');

    // Real-time validation when field is touched
    if (touched[field] && typeof value === 'string') {
      let fieldError: string | undefined;
      switch (field) {
        case 'email':
          fieldError = validateEmail(value);
          break;
        case 'password':
          fieldError = validatePassword(value);
          break;
        case 'role':
          fieldError = validateRole(value);
          break;
      }
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Right Circle */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#4db4ac] opacity-[0.08]"></div>

        {/* Bottom Left Circle */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#4db4ac] opacity-[0.06]"></div>

        {/* Top Left Small Circle */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#4db4ac] opacity-[0.1]"></div>

        {/* Bottom Right Rectangle */}
        <div className="absolute bottom-32 right-20 w-64 h-64 bg-[#4db4ac] opacity-[0.05] rotate-45 rounded-3xl"></div>

        {/* Center Top Rectangle */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-20 bg-[#4db4ac] opacity-[0.07] rounded-full"></div>
      </div>

      <Card className="w-full max-w-md p-8 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] rounded-xl bg-white border-0 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo className="h-20 w-auto" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[#222222] mb-2" style={{ fontWeight: 700 }}>
            Welcome Back
          </h1>
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            Sign in to access the Temporary Staff Coordination System
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {/* Academic Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#555555]">Academic Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#999999]" />
              <Input
                id="email"
                type="email"
                placeholder="name@kln.ac.lk"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`pl-10 border rounded-xl h-12 focus:ring-1 transition-colors ${touched.email && errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                  }`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#555555]">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`pr-10 border rounded-xl h-12 focus:ring-1 transition-colors ${touched.password && errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#999999] hover:text-[#4db4ac] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-[#555555]">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: string) => { handleChange('role', value); handleBlur('role'); }}
            >
              <SelectTrigger className={`border rounded-xl h-12 focus:ring-1 transition-colors ${touched.role && errors.role
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                }`}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="border border-[#e0e0e0] rounded-xl">
                <SelectItem value="hod">Head of Department</SelectItem>
                <SelectItem value="coordinator">Temporary Staff Coordinator</SelectItem>
                <SelectItem value="mentor">Senior Academic Staff</SelectItem>
                <SelectItem value="staff">Temporary Academic Staff</SelectItem>
              </SelectContent>
            </Select>
            {touched.role && errors.role && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.role}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked: boolean) => handleChange('rememberMe', checked)}
                className="border-[#e0e0e0] data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
              />
              <label
                htmlFor="rememberMe"
                className="text-[#555555] cursor-pointer"
                style={{ fontSize: '14px' }}
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[#4db4ac] hover:underline"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-xl shadow-md transition-all duration-200 mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-[#4db4ac] hover:underline"
              style={{ fontWeight: 700 }}
            >
              Sign Up
            </button>
          </p>
        </div>

      </Card>
    </div>
  );
}