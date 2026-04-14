import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { FlaskConical, Mail, Calendar, Users, Loader2 } from 'lucide-react';
import { acceptResearchApplicant, getResearchApplicants, getUserProfileById, rejectResearchApplicant, ResearchApplicantDto, ResearchOpportunityDto, UserProfile } from '../services/api';

interface ResearchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  research: ResearchOpportunityDto | null;
}

export default function ResearchDetailsDialog({ open, onOpenChange, research }: ResearchDetailsDialogProps) {
  if (!research) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [applicants, setApplicants] = useState<ResearchApplicantDto[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const postedDate = useMemo(() => {
    if (research.createdAt) {
      const d = new Date(research.createdAt);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return '';
  }, [research.createdAt]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    getResearchApplicants(research.id)
      .then(setApplicants)
      .catch((e: any) => setError(e?.message || 'Failed to load applicants'))
      .finally(() => setLoading(false));
  }, [open, research.id]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'applied':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleAccept = async (applicationId: string) => {
    const updated = await acceptResearchApplicant(applicationId);
    setApplicants(prev => prev.map(a => a.applicationId === updated.applicationId ? updated : a));
  };

  const handleReject = async (applicationId: string) => {
    const updated = await rejectResearchApplicant(applicationId);
    setApplicants(prev => prev.map(a => a.applicationId === updated.applicationId ? updated : a));
  };

  const handleViewProfile = async (userId: string) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError('');
    setSelectedProfile(null);
    try {
      const p = await getUserProfileById(userId);
      setSelectedProfile(p);
    } catch (e: any) {
      setProfileError(e?.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] bg-white border-0 shadow-lg rounded-xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-[#4db4ac] flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                Research Opportunity Details
              </DialogTitle>
              <DialogDescription className="text-[#555555]" style={{ fontSize: '14px' }}>
                View details and manage applicants for this research opportunity
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-6">
          {/* Research Information */}
          <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
            <h3 className="text-[#222222] mb-2" style={{ fontSize: '18px', fontWeight: 700 }}>
              {research.title}
            </h3>
            <p className="text-[#555555] mb-3" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {research.description || ''}
            </p>
            <div className="flex items-center gap-2 text-[#777777]" style={{ fontSize: '12px' }}>
              <Calendar className="h-4 w-4" />
              <span>Posted: {postedDate}</span>
            </div>
          </Card>

          {/* Applicants Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#4db4ac]" />
              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 700 }}>
                Applicants ({applicants.length})
              </h4>
            </div>

            {loading ? (
              <Card className="border border-[#e0e0e0] rounded-lg p-6 text-center bg-[#f9f9f9]">
                <div className="flex items-center justify-center gap-2 text-[#4db4ac]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading applicants…</span>
                </div>
              </Card>
            ) : error ? (
              <Card className="border border-red-200 rounded-lg p-6 text-center bg-red-50">
                <p className="text-red-600" style={{ fontSize: '14px' }}>{error}</p>
              </Card>
            ) : applicants.length === 0 ? (
              <Card className="border border-[#e0e0e0] rounded-lg p-6 text-center bg-[#f9f9f9]">
                <Users className="h-12 w-12 text-[#cccccc] mx-auto mb-3" />
                <p className="text-[#777777]" style={{ fontSize: '14px' }}>
                  No applicants yet
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {applicants.map((applicant) => (
                  <Card key={applicant.applicationId} className="border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-[#4db4ac]">
                        <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {applicant.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                            {applicant.fullName}
                          </h5>
                          <Badge className={`${getStatusBadgeColor(applicant.status)} border`} style={{ fontSize: '11px' }}>
                            {applicant.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Mail className="h-3 w-3 text-[#4db4ac]" />
                            {applicant.email}
                          </div>
                          <div className="flex items-center gap-2 text-[#777777]" style={{ fontSize: '12px' }}>
                            <Calendar className="h-3 w-3" />
                            Applied: {applicant.appliedAt ? new Date(applicant.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </div>
                          {applicant.specializations?.length > 0 && (
                            <div className="text-[#555555]" style={{ fontSize: '12px' }}>
                              <span style={{ fontWeight: 600 }}>Specializations:</span> {applicant.specializations.join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            style={{ fontSize: '12px' }}
                            disabled={applicant.status !== 'applied'}
                            onClick={() => handleAccept(applicant.applicationId)}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                            style={{ fontSize: '12px' }}
                            disabled={applicant.status !== 'applied'}
                            onClick={() => handleReject(applicant.applicationId)}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white"
                            style={{ fontSize: '12px' }}
                            onClick={() => handleViewProfile(applicant.userId)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
            style={{ fontWeight: 600 }}
          >
            Close
          </Button>
        </div>
      </DialogContent>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white border-0 shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
              Applicant Profile
            </DialogTitle>
            <DialogDescription className="text-[#555555]" style={{ fontSize: '13px' }}>
              Contact details and specializations
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center gap-2 text-[#4db4ac]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading profile…</span>
            </div>
          ) : profileError ? (
            <div className="text-red-600" style={{ fontSize: '14px' }}>{profileError}</div>
          ) : selectedProfile ? (
            <div className="space-y-3">
              <div>
                <div className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 700 }}>{selectedProfile.fullName}</div>
                <div className="text-[#555555]" style={{ fontSize: '13px' }}>{selectedProfile.email}</div>
                {selectedProfile.mobile && (
                  <div className="text-[#555555]" style={{ fontSize: '13px' }}>{selectedProfile.mobile}</div>
                )}
              </div>

              {selectedProfile.preferredSubjects && selectedProfile.preferredSubjects.length > 0 && (
                <div>
                  <div className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 700 }}>Specializations</div>
                  <div className="text-[#555555]" style={{ fontSize: '13px' }}>
                    {selectedProfile.preferredSubjects.join(', ')}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}