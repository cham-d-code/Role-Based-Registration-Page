import { useState } from 'react';
import { User, Mail, Phone, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import Logo from './Logo';
import { register } from '../services/api';

interface SignUpProps {
  onSwitchToSignIn: () => void;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  subjects?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

export default function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: '',
    contractStartDate: '',
    contractEndDate: ''
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const availableSubjects = [
    'Core AI & Machine Learning',
    'Advanced AI Systems',
    'Data Science & Analytics',
    'Computer Vision & Image Processing',
    'Internet of Things (IoT) & Automation',
    'Communication Networks & Information Systems',
    'Software Engineering & System Architecture',
    'Operations & Logistics Management',
    'Supply Chain & Transportation',
    'Process Optimization & Industry 4.0',
    'Total Quality Management (TQM)',
    'Sustainability & Green Logistics',
    'Digital Transformation & ERP Systems',
    'Business Systems Engineering & Business Law',
    'Digital & Social Media Marketing',
    'Consumer Behavior & Financial Fitness',
    'English Language Teaching (ELT/ESL)',
    'Gender & Postcolonial Studies',
    'Psychology (Abnormal & Social)',
    'International Protection of Human Rights',
  ];

  // Validation functions
  const validateFullName = (name: string): string | undefined => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 3) return 'Name must be at least 3 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name should only contain letters';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validateMobile = (mobile: string): string | undefined => {
    if (!mobile) return 'Mobile number is required';
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(mobile.replace(/[+\-\s]/g, ''))) {
      return 'Please enter a valid mobile number (10-15 digits)';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include a special character';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return undefined;
  };

  const validateRole = (role: string): string | undefined => {
    if (!role) return 'Please select a role';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      mobile: validateMobile(formData.mobile),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password),
      role: validateRole(formData.role),
    };

    if (formData.role === 'staff' && selectedSubjects.length === 0) {
      newErrors.subjects = 'Please select at least one preferred subject';
    }

    if (formData.role === 'staff') {
      if (!formData.contractStartDate) newErrors.contractStartDate = 'Contract start date is required';
      if (!formData.contractEndDate) newErrors.contractEndDate = 'Contract end date is required';
      if (formData.contractStartDate && formData.contractEndDate && formData.contractEndDate <= formData.contractStartDate) {
        newErrors.contractEndDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate the specific field on blur
    let fieldError: string | undefined;
    switch (field) {
      case 'fullName':
        fieldError = validateFullName(formData.fullName);
        break;
      case 'email':
        fieldError = validateEmail(formData.email);
        break;
      case 'mobile':
        fieldError = validateMobile(formData.mobile);
        break;
      case 'password':
        fieldError = validatePassword(formData.password);
        break;
      case 'confirmPassword':
        fieldError = validateConfirmPassword(formData.confirmPassword, formData.password);
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
    setTouched({
      fullName: true,
      email: true,
      mobile: true,
      password: true,
      confirmPassword: true,
      role: true,
      contractStartDate: true,
      contractEndDate: true
    });

    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        mobile: formData.mobile,
        role: formData.role,
        preferredSubjects: selectedSubjects,
        ...(formData.role === 'staff' && {
          contractStartDate: formData.contractStartDate,
          contractEndDate: formData.contractEndDate
        })
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');

    // Clear field error when typing
    if (touched[field]) {
      let fieldError: string | undefined;
      switch (field) {
        case 'fullName':
          fieldError = validateFullName(value);
          break;
        case 'email':
          fieldError = validateEmail(value);
          break;
        case 'mobile':
          fieldError = validateMobile(value);
          break;
        case 'password':
          fieldError = validatePassword(value);
          // Also revalidate confirm password
          if (formData.confirmPassword) {
            setErrors(prev => ({
              ...prev,
              password: fieldError,
              confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
            }));
            return;
          }
          break;
        case 'confirmPassword':
          fieldError = validateConfirmPassword(value, formData.password);
          break;
        case 'role':
          fieldError = validateRole(value);
          break;
      }
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => {
      const newSubjects = prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject];

      // Clear subject error if at least one selected
      if (newSubjects.length > 0) {
        setErrors(prev => ({ ...prev, subjects: undefined }));
      }
      return newSubjects;
    });
  };

  // Password strength indicator
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);


  // Show success message after registration
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        <Card className="w-full max-w-md p-8 shadow-lg rounded-xl bg-white border-0 relative z-10 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#222222] mb-2">Registration Successful!</h2>
          <p className="text-[#555555] mb-6">
            Your account is pending approval. You'll be notified once an administrator approves your registration.
          </p>
          <Button
            onClick={onSwitchToSignIn}
            className="w-full h-12 bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-xl"
          >
            Back to Sign In
          </Button>
        </Card>
      </div>
    );
  }

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
            Create Your Account
          </h1>
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            Sign up to access the Temporary Staff Coordination System
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[#555555]">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#999999]" />
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                className={`pl-10 border rounded-xl h-12 focus:ring-1 transition-colors ${touched.fullName && errors.fullName
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                  }`}
              />
            </div>
            {touched.fullName && errors.fullName && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.fullName}
              </p>
            )}
          </div>

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

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-[#555555]">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#999999]" />
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                onBlur={() => handleBlur('mobile')}
                className={`pl-10 border rounded-xl h-12 focus:ring-1 transition-colors ${touched.mobile && errors.mobile
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                  }`}
              />
            </div>
            {touched.mobile && errors.mobile && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.mobile}
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
                placeholder="Create a password"
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
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${level <= passwordStrength.strength
                          ? passwordStrength.color
                          : 'bg-gray-200'
                        }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength.strength <= 2 ? 'text-red-500' :
                    passwordStrength.strength <= 3 ? 'text-yellow-600' :
                      passwordStrength.strength <= 4 ? 'text-blue-500' : 'text-green-500'
                  }`}>
                  Password strength: {passwordStrength.label}
                </p>
              </div>
            )}
            {touched.password && errors.password && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#555555]">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`pr-10 border rounded-xl h-12 focus:ring-1 transition-colors ${touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#999999] hover:text-[#4db4ac] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-[#555555]">Role</Label>
            <Select value={formData.role} onValueChange={(value: string) => { handleChange('role', value); handleBlur('role'); }}>
              <SelectTrigger className={`border rounded-xl h-12 focus:ring-1 transition-colors ${touched.role && errors.role
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'
                }`}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hod">Head of Department</SelectItem>
                <SelectItem value="coordinator">Temporary Staff Coordinator</SelectItem>
                <SelectItem value="mentor">Senior Lecturer (Mentor)</SelectItem>
                <SelectItem value="staff">Temporary Staff</SelectItem>
              </SelectContent>
            </Select>
            {touched.role && errors.role && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.role}
              </p>
            )}
          </div>

          {/* Contract Dates - Only for Temporary Staff */}
          {formData.role === 'staff' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[#555555]">Contract Start Date</Label>
                <Input
                  type="date"
                  value={formData.contractStartDate}
                  onChange={e => handleChange('contractStartDate', e.target.value)}
                  onBlur={() => handleBlur('contractStartDate')}
                  className={`border rounded-xl h-12 focus:ring-1 transition-colors ${touched.contractStartDate && errors.contractStartDate
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'}`}
                />
                {touched.contractStartDate && errors.contractStartDate && (
                  <p className="text-red-500 flex items-center gap-1" style={{ fontSize: '12px' }}>
                    <AlertCircle className="h-3 w-3" />{errors.contractStartDate}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[#555555]">Contract End Date</Label>
                <Input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={e => handleChange('contractEndDate', e.target.value)}
                  onBlur={() => handleBlur('contractEndDate')}
                  className={`border rounded-xl h-12 focus:ring-1 transition-colors ${touched.contractEndDate && errors.contractEndDate
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-[#e0e0e0] focus:border-[#4db4ac] focus:ring-[#4db4ac]'}`}
                />
                {touched.contractEndDate && errors.contractEndDate && (
                  <p className="text-red-500 flex items-center gap-1" style={{ fontSize: '12px' }}>
                    <AlertCircle className="h-3 w-3" />{errors.contractEndDate}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preferred Subjects - Only for Temporary Staff */}
          {formData.role === 'staff' && (
            <div className="space-y-3 pt-2">
              <Label className="text-[#555555]">Preferred Subjects</Label>
              <div className="border border-[#e0e0e0] rounded-xl p-4 bg-[#f9f9f9]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSubjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={() => handleSubjectToggle(subject)}
                        className="border-[#4db4ac] data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
                      />
                      <label
                        htmlFor={subject}
                        className="text-[#555555] cursor-pointer"
                        style={{ fontSize: '14px' }}
                      >
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-xl shadow-md transition-all duration-200 mt-6"
          >
            Sign Up
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            Already signed up?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-[#4db4ac] hover:underline"
              style={{ fontWeight: 700 }}
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-[#e0e0e0]">
          <p className="text-[#999999]" style={{ fontSize: '12px' }}>
            University of Kelaniya | Temporary Staff Coordination System
          </p>
        </div>
      </Card>
    </div>
  );
}