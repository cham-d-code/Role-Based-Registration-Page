import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import {
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Loader2,
  Clock,
} from 'lucide-react';
import { getUserProfileById, UserProfile } from '../services/api';

interface StaffProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  fallbackName?: string;
}

function formatDate(s?: string): string {
  if (!s) return 'Not set';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function initialsFrom(name?: string): string {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function StaffProfileDialog({
  open,
  onOpenChange,
  staffId,
  fallbackName,
}: StaffProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !staffId) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setProfile(null);
    getUserProfileById(staffId)
      .then((p) => {
        if (mounted) setProfile(p);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || 'Failed to load profile');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, staffId]);

  const name = profile?.fullName || fallbackName || 'Temporary Staff';
  const end = profile?.contractEndDate ? new Date(profile.contractEndDate) : null;
  const daysLeft = end ? Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const expired = daysLeft !== null && daysLeft < 0;
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontSize: '22px', fontWeight: 700 }}>
            Temporary Staff Profile
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-[#4db4ac]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span style={{ fontSize: '14px' }}>Loading profile…</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg" style={{ fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <div className="space-y-6 py-2">
            <Card className="bg-[#f9fdfc] border border-[#d9efec] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Avatar className="h-24 w-24 border-2 border-[#4db4ac]">
                  <AvatarImage src={profile.profileImageUrl} alt={name} />
                  <AvatarFallback
                    className="bg-[#4db4ac] text-white"
                    style={{ fontSize: '24px', fontWeight: 700 }}
                  >
                    {initialsFrom(name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                    {name}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#4db4ac]" />
                      {profile.email}
                    </div>
                    {profile.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#4db4ac]" />
                        {profile.mobile}
                      </div>
                    )}
                    {profile.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#4db4ac]" />
                        Joined {formatDate(profile.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-[#e0e0e0] rounded-xl p-4">
                <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                  CONTRACT START
                </p>
                <p className="text-[#222222] flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                  <Calendar className="h-4 w-4 text-[#4db4ac]" />
                  {formatDate(profile.contractStartDate)}
                </p>
              </Card>
              <Card className="border border-[#e0e0e0] rounded-xl p-4">
                <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                  CONTRACT END
                </p>
                <p className="text-[#222222] flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                  <Calendar className="h-4 w-4 text-[#4db4ac]" />
                  {formatDate(profile.contractEndDate)}
                </p>
                {daysLeft !== null && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 ${expired
                      ? 'bg-red-50 text-red-600'
                      : expiringSoon
                        ? 'bg-orange-50 text-orange-600'
                        : 'bg-green-50 text-green-700'
                      }`}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    <Clock className="h-3 w-3" />
                    {expired
                      ? `Expired ${Math.abs(daysLeft)}d ago`
                      : `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
                  </div>
                )}
              </Card>
            </div>

            {/* Preferred Subjects */}
            {profile.preferredSubjects && profile.preferredSubjects.length > 0 && (
              <Card className="border border-[#e0e0e0] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-[#4db4ac]" />
                  <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Preferred Subjects
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredSubjects.map((s, i) => (
                    <Badge
                      key={`${s}-${i}`}
                      className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]"
                      style={{ fontSize: '11px' }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
