import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Eye, EyeOff, Save, X } from 'lucide-react';
import { Alert } from './ui/alert';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: {
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    initials: string;
  };
  onSave: (updatedProfile: {
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    newPassword?: string;
  }) => void;
}

export default function EditProfileDialog({ 
  open, 
  onOpenChange, 
  currentProfile,
  onSave 
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentProfile.name);
  const [email, setEmail] = useState(currentProfile.email);
  const [phone, setPhone] = useState(currentProfile.phone);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(currentProfile.avatarUrl || '');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Validate password if user is trying to change it
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setPasswordError('Please enter your current password');
        return;
      }
      if (!newPassword) {
        setPasswordError('Please enter a new password');
        return;
      }
      if (newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
    }

    setPasswordError('');
    
    onSave({
      name,
      email,
      phone,
      avatarUrl: avatarUrl || undefined,
      newPassword: newPassword || undefined
    });

    // Reset password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset all fields to original values
    setName(currentProfile.name);
    setEmail(currentProfile.email);
    setPhone(currentProfile.phone);
    setAvatarUrl(currentProfile.avatarUrl || '');
    setAvatarPreview(currentProfile.avatarUrl || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture Section */}
          <div>
            <Label className="text-[#222222] mb-3 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Profile Picture
            </Label>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-[#4db4ac]">
                <AvatarImage src={avatarPreview} alt={name} />
                <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '28px' }}>
                  {currentProfile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label htmlFor="avatar-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6] cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                  </Button>
                </label>
                <p className="text-[#999999] mt-2" style={{ fontSize: '12px' }}>
                  Recommended: Square image, at least 400x400px
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Information Section */}
          <div>
            <h3 className="text-[#222222] mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#555555] mb-2 block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#e0e0e0] focus:border-[#4db4ac]"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-[#555555] mb-2 block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#e0e0e0] focus:border-[#4db4ac]"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-[#555555] mb-2 block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Mobile Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-[#e0e0e0] focus:border-[#4db4ac]"
                  placeholder="+94 XX XXX XXXX"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Change Password Section */}
          <div>
            <h3 className="text-[#222222] mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
              Change Password
            </h3>
            <p className="text-[#999999] mb-4" style={{ fontSize: '12px' }}>
              Leave blank if you don't want to change your password
            </p>

            {passwordError && (
              <Alert className="bg-red-50 border-red-400 text-red-700 mb-4">
                {passwordError}
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-[#555555] mb-2 block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-[#e0e0e0] focus:border-[#4db4ac] pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#4db4ac]"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-[#555555] mb-2 block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-[#e0e0e0] focus:border-[#4db4ac] pr-10"
                    placeholder="Enter new password (min. 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#4db4ac]"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-[#555555] mb-2 block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-[#e0e0e0] focus:border-[#4db4ac] pr-10"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#4db4ac]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-[#e0e0e0] text-[#555555] hover:bg-[#f9f9f9]"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
