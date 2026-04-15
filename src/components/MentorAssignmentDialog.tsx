import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItemRich, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { getApprovedMentors, UserProfile } from '../services/api';

interface Mentor {
  id: string;
  name: string;
  specializations: string[];
  currentAssignments: number;
  matchScore?: number;
}

interface StaffMember {
  id: string;
  name: string;
  preferredSubjects: string[];
}

interface MentorAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: StaffMember | null;
  onAssign: (staffId: string, mentorId: string) => void;
}

export default function MentorAssignmentDialog({ 
  open, 
  onOpenChange, 
  staffMember,
  onAssign 
}: MentorAssignmentDialogProps) {
  const [selectedMentor, setSelectedMentor] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingMentors(true);
    getApprovedMentors()
      .then((data: UserProfile[]) => {
        const mapped: Mentor[] = data.map((u) => ({
          id: u.id,
          name: u.fullName,
          specializations: u.specialization
            ? String(u.specialization)
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          currentAssignments: u.menteesCount ?? 0,
        }));
        setMentors(mapped);
      })
      .catch((e) => {
        console.error('Failed to load mentors', e);
        setMentors([]);
      })
      .finally(() => setLoadingMentors(false));
  }, [open]);

  // FR10: Automatic mentor suggestion based on subject matching
  const calculateMatchScore = (mentor: Mentor, staffSubjects: string[]) => {
    const matches = mentor.specializations.filter(spec => 
      staffSubjects.some(subject => 
        spec.toLowerCase().includes(subject.toLowerCase()) || 
        subject.toLowerCase().includes(spec.toLowerCase())
      )
    );
    return matches.length;
  };

  const suggestedMentors = useMemo(() => (staffMember 
    ? mentors
        .map(mentor => ({
          ...mentor,
          matchScore: calculateMatchScore(mentor, staffMember.preferredSubjects)
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : []), [staffMember, mentors]);

  const topSuggestion = suggestedMentors[0];

  const handleAssign = () => {
    if (selectedMentor && staffMember) {
      onAssign(staffMember.id, selectedMentor);
      setSelectedMentor('');
      onOpenChange(false);
    } else {
      alert('Please select a mentor!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Fixed-size dialog (near full-screen so no page scrolling needed) */}
      <DialogContent className="bg-white w-[95vw] max-w-4xl h-[90vh] overflow-hidden p-0">
        <div className="flex h-full flex-col">
          <div className="px-6 pt-6">
            <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            Assign Mentor
            <div className="flex gap-2">
              <Badge className="bg-[#4db4ac] text-white">FR9</Badge>
              <Badge className="bg-[#4db4ac] text-white">FR10</Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-[#555555] mt-2" style={{ fontSize: '14px' }}>
            Select a mentor for {staffMember ? staffMember.name : 'the staff member'} based on their specializations.
          </DialogDescription>
            </DialogHeader>
          </div>

        {staffMember && (
          <div className="flex-1 min-h-0 px-6 py-4 space-y-3 overflow-hidden">
            {/* Staff Member Info */}
            <div className="bg-[#f9f9f9] p-3 rounded-lg">
              <p className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                Staff Member: {staffMember.name}
              </p>
              <p className="text-[#555555] mt-1 truncate" style={{ fontSize: '12px' }} title={staffMember.preferredSubjects.join(', ')}>
                Preferred Subjects: {staffMember.preferredSubjects.join(', ')}
              </p>
            </div>

            <Separator className="my-1" />

            {/* FR10: Auto-suggested Mentor */}
            {topSuggestion && topSuggestion.matchScore! > 0 && (
              <div className="bg-gradient-to-r from-[#e6f7f6] to-white p-3 rounded-lg border-2 border-[#4db4ac]">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#4db4ac] flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[#4db4ac]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      AI-Suggested Best Match
                    </p>
                    <p className="text-[#222222] mt-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {topSuggestion.name}
                    </p>
                    <p className="text-[#555555] mt-1" style={{ fontSize: '12px' }}>
                      Matches: {topSuggestion.matchScore}
                      {' • '}
                      Current mentees: {topSuggestion.currentAssignments}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {topSuggestion.specializations
                        .filter(spec => 
                          staffMember.preferredSubjects.some(subject => 
                            spec.toLowerCase().includes(subject.toLowerCase()) || 
                            subject.toLowerCase().includes(spec.toLowerCase())
                          )
                        )
                        .slice(0, 3)
                        .map((spec, idx) => (
                          <Badge key={idx} className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                            {spec}
                          </Badge>
                        ))}
                    </div>
                    <Button
                      onClick={() => setSelectedMentor(topSuggestion.id)}
                      className="mt-2 bg-[#4db4ac] hover:bg-[#3c9a93] text-white h-8"
                      style={{ fontSize: '12px' }}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Select This Mentor
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Mentor Selection */}
            <div>
              <Label className="text-[#555555] mb-2 block">
                Or Choose a Mentor Manually
              </Label>
              {loadingMentors && (
                <p className="text-[#999999]" style={{ fontSize: '12px' }}>Loading mentors…</p>
              )}
              <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                <SelectTrigger className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]">
                  <SelectValue
                    placeholder="Select a mentor"
                    // Keep the field clean; details are shown in the opened list items.
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[320px] overflow-y-auto">
                  {suggestedMentors.map((mentor) => (
                    <SelectItemRich key={mentor.id} value={mentor.id} text={mentor.name}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                            {mentor.name}
                          </span>
                          <span
                            className="text-[#777777] truncate max-w-[58vw] sm:max-w-[520px]"
                            style={{ fontSize: '12px' }}
                            title={mentor.specializations.join(', ')}
                          >
                            {mentor.specializations.length > 0 ? mentor.specializations.join(', ') : '—'}
                          </span>
                          <span className="text-[#777777]" style={{ fontSize: '12px' }}>
                            Mentees: {mentor.currentAssignments}
                          </span>
                        </div>
                        {mentor.matchScore! > 0 && (
                          <Badge className="bg-[#4db4ac] text-white ml-2" style={{ fontSize: '10px' }}>
                            {mentor.matchScore} match(es)
                          </Badge>
                        )}
                      </div>
                    </SelectItemRich>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

          <div className="px-6 pb-6 pt-2">
            <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#d0d0d0] text-[#555555]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
            disabled={!selectedMentor}
          >
            Assign Mentor
          </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}