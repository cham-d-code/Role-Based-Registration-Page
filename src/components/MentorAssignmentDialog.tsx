import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Separator } from './ui/separator';

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

  // Simulated mentor data with specializations
  const mentors: Mentor[] = [
    {
      id: 'M001',
      name: 'Dr. T. Mahanama',
      specializations: ['Marketing Management', 'Consumer Behavior', 'Brand Management'],
      currentAssignments: 2
    },
    {
      id: 'M002',
      name: 'Dr. R. Fernando',
      specializations: ['Operations Management', 'Supply Chain Management', 'Quality Management'],
      currentAssignments: 3
    },
    {
      id: 'M003',
      name: 'Dr. S. Perera',
      specializations: ['Human Resource Management', 'Organizational Behavior', 'Strategic Management'],
      currentAssignments: 1
    },
    {
      id: 'M004',
      name: 'Dr. K. Silva',
      specializations: ['Marketing Management', 'Digital Marketing', 'E-Commerce'],
      currentAssignments: 2
    }
  ];

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

  const suggestedMentors = staffMember 
    ? mentors
        .map(mentor => ({
          ...mentor,
          matchScore: calculateMatchScore(mentor, staffMember.preferredSubjects)
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : [];

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
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
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

        {staffMember && (
          <div className="space-y-4">
            {/* Staff Member Info */}
            <div className="bg-[#f9f9f9] p-4 rounded-lg">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                Staff Member: {staffMember.name}
              </p>
              <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                Preferred Subjects: {staffMember.preferredSubjects.join(', ')}
              </p>
            </div>

            <Separator />

            {/* FR10: Auto-suggested Mentor */}
            {topSuggestion && topSuggestion.matchScore! > 0 && (
              <div className="bg-gradient-to-r from-[#e6f7f6] to-white p-4 rounded-lg border-2 border-[#4db4ac]">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#4db4ac] flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[#4db4ac]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      🎯 AI-Suggested Best Match
                    </p>
                    <p className="text-[#222222] mt-2" style={{ fontSize: '15px', fontWeight: 600 }}>
                      {topSuggestion.name}
                    </p>
                    <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                      Matching Specializations: {topSuggestion.matchScore} match(es)
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {topSuggestion.specializations
                        .filter(spec => 
                          staffMember.preferredSubjects.some(subject => 
                            spec.toLowerCase().includes(subject.toLowerCase()) || 
                            subject.toLowerCase().includes(spec.toLowerCase())
                          )
                        )
                        .map((spec, idx) => (
                          <Badge key={idx} className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                            {spec}
                          </Badge>
                        ))}
                    </div>
                    <Button
                      onClick={() => setSelectedMentor(topSuggestion.id)}
                      className="mt-3 bg-[#4db4ac] hover:bg-[#3c9a93] text-white h-8"
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
              <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                <SelectTrigger className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]">
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {suggestedMentors.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{mentor.name}</span>
                        {mentor.matchScore! > 0 && (
                          <Badge className="bg-[#4db4ac] text-white ml-2" style={{ fontSize: '10px' }}>
                            {mentor.matchScore} match(es)
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Mentor Details */}
            {selectedMentor && (
              <div className="bg-[#f9f9f9] p-4 rounded-lg">
                {(() => {
                  const mentor = mentors.find(m => m.id === selectedMentor);
                  return mentor ? (
                    <>
                      <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {mentor.name}
                      </p>
                      <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                        Specializations: {mentor.specializations.join(', ')}
                      </p>
                      <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                        Current Assignments: {mentor.currentAssignments}
                      </p>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}

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
      </DialogContent>
    </Dialog>
  );
}