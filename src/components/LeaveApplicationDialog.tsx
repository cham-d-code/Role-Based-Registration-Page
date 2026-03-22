import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, User, Sparkles } from 'lucide-react';
import { Separator } from './ui/separator';

interface SubstituteStaff {
  id: string;
  name: string;
  availableSubjects: string[];
  currentLoad: number;
  matchScore?: number;
}

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserSubjects: string[];
  onSubmit: (leaveData: any) => void;
}

export default function LeaveApplicationDialog({ 
  open, 
  onOpenChange,
  currentUserSubjects,
  onSubmit 
}: LeaveApplicationDialogProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    substituteId: ''
  });

  // Simulated substitute staff data
  const allSubstituteStaff: SubstituteStaff[] = [
    {
      id: 'SUB001',
      name: 'A.B. Perera',
      availableSubjects: ['Marketing Management', 'Consumer Behavior', 'Brand Management'],
      currentLoad: 2
    },
    {
      id: 'SUB002',
      name: 'N.P. Jayawardena',
      availableSubjects: ['Operations Management', 'Supply Chain Management'],
      currentLoad: 1
    },
    {
      id: 'SUB003',
      name: 'S.K. Fernando',
      availableSubjects: ['Marketing Management', 'Digital Marketing'],
      currentLoad: 3
    },
    {
      id: 'SUB004',
      name: 'R.T. Silva',
      availableSubjects: ['Human Resource Management', 'Organizational Behavior'],
      currentLoad: 2
    }
  ];

  // FR19: Automatic filtering of substitute staff based on subject matching
  const calculateMatchScore = (staff: SubstituteStaff) => {
    const matches = staff.availableSubjects.filter(subject => 
      currentUserSubjects.some(userSubject => 
        subject.toLowerCase().includes(userSubject.toLowerCase()) || 
        userSubject.toLowerCase().includes(subject.toLowerCase())
      )
    );
    return matches.length;
  };

  const filteredSubstitutes = allSubstituteStaff
    .map(staff => ({
      ...staff,
      matchScore: calculateMatchScore(staff)
    }))
    .filter(staff => staff.matchScore! > 0) // Only show staff with matching subjects
    .sort((a, b) => {
      // Sort by match score first, then by current load (lower is better)
      if (b.matchScore! !== a.matchScore!) {
        return b.matchScore! - a.matchScore!;
      }
      return a.currentLoad - b.currentLoad;
    });

  const bestMatch = filteredSubstitutes[0];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.startDate || !formData.endDate || !formData.reason || !formData.substituteId) {
      alert('Please fill all required fields!');
      return;
    }

    const selectedSubstitute = allSubstituteStaff.find(s => s.id === formData.substituteId);
    
    onSubmit({
      ...formData,
      substituteName: selectedSubstitute?.name,
      status: 'pending'
    });

    // Reset form
    setFormData({
      startDate: '',
      endDate: '',
      reason: '',
      substituteId: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            Apply for Leave
            <Badge className="bg-[#4db4ac] text-white">FR18</Badge>
            <Badge className="bg-[#4db4ac] text-white">FR19</Badge>
          </DialogTitle>
          <DialogDescription className="text-[#555555] mt-2" style={{ fontSize: '14px' }}>
            Please fill in the details below to apply for leave.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#e6f7f6] p-4 rounded-lg">
            <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Your Teaching Subjects
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {currentUserSubjects.map((subject, idx) => (
                <Badge key={idx} className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Leave Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                End Date *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
              Reason for Leave *
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="Please provide the reason for your leave request..."
              className="min-h-[100px] border-[#d0d0d0] focus:border-[#4db4ac] rounded-lg"
              style={{ fontSize: '14px' }}
            />
          </div>

          <Separator />

          {/* FR19: AI-Suggested Substitute */}
          {bestMatch && (
            <div className="bg-gradient-to-r from-[#e6f7f6] to-white p-4 rounded-lg border-2 border-[#4db4ac]">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#4db4ac] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[#4db4ac]" style={{ fontSize: '14px', fontWeight: 700 }}>
                    🎯 AI-Suggested Best Substitute
                  </p>
                  <p className="text-[#222222] mt-2" style={{ fontSize: '15px', fontWeight: 600 }}>
                    {bestMatch.name}
                  </p>
                  <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                    Matching Subjects: {bestMatch.matchScore} match(es) • Current Load: {bestMatch.currentLoad} classes
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bestMatch.availableSubjects
                      .filter(subject => 
                        currentUserSubjects.some(userSubject => 
                          subject.toLowerCase().includes(userSubject.toLowerCase()) || 
                          userSubject.toLowerCase().includes(subject.toLowerCase())
                        )
                      )
                      .map((subject, idx) => (
                        <Badge key={idx} className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                          {subject}
                        </Badge>
                      ))}
                  </div>
                  <Button
                    onClick={() => handleChange('substituteId', bestMatch.id)}
                    className="mt-3 bg-[#4db4ac] hover:bg-[#3c9a93] text-white h-8"
                    style={{ fontSize: '12px' }}
                  >
                    Select This Substitute
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Substitute Selection */}
          <div>
            <Label className="text-[#555555] mb-2 block">
              Select Substitute Staff Member *
            </Label>
            <Select value={formData.substituteId} onValueChange={(value) => handleChange('substituteId', value)}>
              <SelectTrigger className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]">
                <SelectValue placeholder="Choose a substitute staff member" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubstitutes.length > 0 ? (
                  filteredSubstitutes.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{staff.name}</span>
                        <Badge className="bg-[#4db4ac] text-white ml-2" style={{ fontSize: '10px' }}>
                          {staff.matchScore} match(es)
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No suitable substitute staff available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {filteredSubstitutes.length === 0 && (
              <p className="text-red-600 mt-2" style={{ fontSize: '12px' }}>
                ⚠ No substitute staff members match your teaching subjects. Please contact the coordinator.
              </p>
            )}
          </div>

          {/* Selected Substitute Details */}
          {formData.substituteId && (
            <div className="bg-[#f9f9f9] p-4 rounded-lg">
              {(() => {
                const selected = allSubstituteStaff.find(s => s.id === formData.substituteId);
                return selected ? (
                  <>
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Selected: {selected.name}
                    </p>
                    <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                      Available Subjects: {selected.availableSubjects.join(', ')}
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                      Current Workload: {selected.currentLoad} classes
                    </p>
                  </>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#d0d0d0] text-[#555555]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
            disabled={filteredSubstitutes.length === 0}
          >
            Submit Leave Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}