import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Logo from './Logo';
import { forgotPassword, resetPassword } from '../services/api';

interface PasswordResetProps {
  onBackToSignIn: () => void;
}

export default function PasswordReset({ onBackToSignIn }: PasswordResetProps) {
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
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
        setFormData(prev => ({ ...prev, otp: result.resetToken || prev.otp }));
        setStep('verify');
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.otp.trim()) {
      setError('Please enter the OTP sent to your email.');
      return;
    }
    if (!formData.newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(formData.otp.trim(), formData.newPassword);
      if (result.success) {
        setStep('success');
      } else {
        setError(result.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Reset password error:', err);
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
              <form onSubmit={handleRequestOtp} className="space-y-4">
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
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
          ) : step === 'verify' ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-[#222222] mb-2" style={{ fontWeight: 700, fontSize: '28px' }}>
                  Enter OTP
                </h1>
                <p className="text-[#555555]" style={{ fontSize: '14px' }}>
                  We sent a 6-digit OTP to <span className="text-[#4db4ac]" style={{ fontWeight: 600 }}>{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="otp" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                    OTP
                  </Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={(e) => handleChange('otp', e.target.value)}
                    className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac] hover:border-[#4db4ac] transition-colors"
                    style={{ fontSize: '14px', letterSpacing: '0.15em' }}
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac] hover:border-[#4db4ac] transition-colors"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac] hover:border-[#4db4ac] transition-colors"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg transition-colors"
                  style={{ fontSize: '15px', fontWeight: 600 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-[#555555] hover:underline"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Change email/role
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      setIsLoading(true);
                      try {
                        const result = await forgotPassword(formData.email, formData.role);
                        if (result.success) {
                          setFormData(prev => ({ ...prev, otp: result.resetToken || '' }));
                        } else {
                          setError(result.message || 'Failed to resend OTP.');
                        }
                      } catch {
                        setError('Unable to connect to server. Please try again.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="text-[#4db4ac] hover:underline"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onBackToSignIn}
                  className="w-full flex items-center justify-center gap-2 text-[#4db4ac] hover:text-[#3c9a93] transition-colors mt-2"
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
                  Password updated
                </h2>
                <p className="text-[#555555] mb-6" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>

                <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4 mb-6 text-left">
                  <p className="text-[#555555]" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <strong className="text-[#222222]">Security Note:</strong> If you didn’t request this reset, contact the system administrator immediately.
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

    </div>
  );
}
