import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Logo from './Logo';
import { forgotPassword } from '../services/api';

interface PasswordResetProps {
  onBackToSignIn: () => void;
}

export default function PasswordReset({ onBackToSignIn }: PasswordResetProps) {
  const [step, setStep] = useState<'request' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    role: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.email || !formData.role) {
      setError('Please enter your email and select your role!');
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(formData.email, formData.role);

      if (result.success) {
        setStep('success');
      } else {
        setError(result.message || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#4db4ac] opacity-[0.08]"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#4db4ac] opacity-[0.06]"></div>
        <div className="absolute -top-20 left-1/4 w-64 h-64 rounded-full bg-[#4db4ac] opacity-[0.05]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#4db4ac] opacity-[0.04]"></div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.12)] border-0 overflow-hidden relative z-10">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-auto" />
          </div>

          {step === 'request' ? (
            <>
              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-[#222222] mb-2" style={{ fontWeight: 700, fontSize: '28px' }}>
                  Reset Password
                </h1>
                <p className="text-[#555555]" style={{ fontSize: '14px' }}>
                  Enter your email and role to receive password reset instructions
                </p>
              </div>

              {/* FR8 Badge */}
              <div className="flex justify-center mb-6">
                <div className="bg-[#4db4ac] text-white px-3 py-1 rounded-full" style={{ fontSize: '12px', fontWeight: 600 }}>
                  FR8: Secure Password Reset
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10 h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac] hover:border-[#4db4ac] transition-colors"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <Label htmlFor="role" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Select Your Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                    <SelectTrigger className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] hover:border-[#4db4ac] transition-colors">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hod">Head of Department</SelectItem>
                      <SelectItem value="coordinator">Temporary Staff Coordinator</SelectItem>
                      <SelectItem value="mentor">Senior Lecturer (Mentor)</SelectItem>
                      <SelectItem value="staff">Temporary Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg transition-colors"
                  style={{ fontSize: '15px', fontWeight: 600 }}
                >
                  Send Reset Link
                </Button>

                {/* Back to Sign In */}
                <button
                  type="button"
                  onClick={onBackToSignIn}
                  className="w-full flex items-center justify-center gap-2 text-[#4db4ac] hover:text-[#3c9a93] transition-colors mt-4"
                  style={{ fontSize: '14px', fontWeight: 500 }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 bg-[#e6f7f6] rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-[#4db4ac]" />
                  </div>
                </div>

                <h2 className="text-[#222222] mb-3" style={{ fontWeight: 700, fontSize: '24px' }}>
                  Check Your Email
                </h2>
                <p className="text-[#555555] mb-6" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  We've sent password reset instructions to<br />
                  <span className="text-[#4db4ac]" style={{ fontWeight: 600 }}>{formData.email}</span>
                </p>

                <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4 mb-6 text-left">
                  <p className="text-[#555555]" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <strong className="text-[#222222]">Security Note:</strong> The reset link will expire in 30 minutes. If you don't receive the email, check your spam folder or contact the system administrator.
                  </p>
                </div>

                <Button
                  onClick={onBackToSignIn}
                  className="w-full h-12 bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
                  style={{ fontSize: '15px', fontWeight: 600 }}
                >
                  Return to Sign In
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[#999999]" style={{ fontSize: '13px' }}>
          University of Kelaniya | Temporary Staff Coordination System
        </p>
      </footer>
    </div>
  );
}
