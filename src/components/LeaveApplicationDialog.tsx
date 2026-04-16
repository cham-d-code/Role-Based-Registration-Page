import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectItemRich, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Sparkles } from 'lucide-react';
import { Separator } from './ui/separator';
import { getApprovedStaff } from '../services/api';

interface SubstituteStaff {
  id: string;
  name: string;
  availableSubjects: string[];
  matchingSubjects?: string[];
  matchScore?: number;
}

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserSubjects: string[];
  currentUserId?: string | null;
  onSubmit: (leaveData: any) => void;
}

export default function LeaveApplicationDialog({ 
  open, 
  onOpenChange,
  currentUserSubjects,
  currentUserId,
  onSubmit 
}: LeaveApplicationDialogProps) {
  const [formData, setFormData] = useState({
    leaveDate: '',
    reason: '',
    substituteId: ''
  });

  const [allSubstituteStaff, setAllSubstituteStaff] = useState<SubstituteStaff[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingSubs(true);
    getApprovedStaff()
      .then((staff) => {
        const mapped: SubstituteStaff[] = staff.map((s) => ({
          id: s.id,
          name: s.fullName,
          availableSubjects: s.preferredSubjects ?? [],
        }));
        setAllSubstituteStaff(mapped);
      })
      .catch((e) => {
        console.error('Failed to load substitute staff', e);
        setAllSubstituteStaff([]);
      })
      .finally(() => setLoadingSubs(false));
  }, [open]);

  // Subject matching (fuzzy includes) to recommend substitutes
  const calculateMatchingSubjects = (staff: SubstituteStaff) => {
    const matching = staff.availableSubjects.filter((subject) =>
      currentUserSubjects.some(
        (userSubject) =>
          subject.toLowerCase().includes(userSubject.toLowerCase()) ||
          userSubject.toLowerCase().includes(subject.toLowerCase())
      )
    );
    return Array.from(new Set(matching));
  };

  const allSelectableSubstitutes = useMemo(() => {
    const list = allSubstituteStaff
      .map((staff) => {
        const matchingSubjects = calculateMatchingSubjects(staff);
        return {
          ...staff,
          matchingSubjects,
          matchScore: matchingSubjects.length,
        };
      })
      .filter((staff) => {
        if (currentUserId && staff.id === currentUserId) return false;
        return true;
      });

    // Sort by match score first, then by name
    list.sort((a, b) => {
      const diff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
      if (diff !== 0) return diff;
      return String(a.name).localeCompare(String(b.name));
    });

    return list;
  }, [allSubstituteStaff, currentUserSubjects, currentUserId]);

  const bestMatch = allSelectableSubstitutes.find((staff) => (staff.matchScore ?? 0) > 0);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.leaveDate || !formData.reason || !formData.substituteId) {
      alert('Please fill all required fields!');
      return;
    }

    const selectedSubstitute = allSubstituteStaff.find(s => s.id === formData.substituteId);
    
    onSubmit({
      ...formData,
      substituteName: selectedSubstitute?.name,
    });

    // Reset form
    setFormData({
      leaveDate: '',
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
          {/* Leave Date */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="leaveDate" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 500 }}>
                Select Date *
              </Label>
              <Input
                id="leaveDate"
                type="date"
                value={formData.leaveDate}
                onChange={(e) => handleChange('leaveDate', e.target.value)}
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
                    🎯 System suggested substitute
                  </p>
                  <p className="text-[#222222] mt-2" style={{ fontSize: '15px', fontWeight: 600 }}>
                    {bestMatch.name}
                  </p>
                  <p className="text-[#555555] mt-1" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Matching subjects:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(bestMatch.matchingSubjects ?? []).map((subject: string, idx: number) => (
                      <Badge key={`${subject}-${idx}`} className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
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
            {loadingSubs && (
              <p className="text-[#999999] mb-2" style={{ fontSize: '12px' }}>
                Loading substitute staff…
              </p>
            )}
            <Select value={formData.substituteId} onValueChange={(value) => handleChange('substituteId', value)}>
              <SelectTrigger className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]">
                <SelectValue placeholder="Choose a substitute staff member" />
              </SelectTrigger>
              <SelectContent>
                {allSelectableSubstitutes.length > 0 ? (
                  allSelectableSubstitutes
                    .filter((s) => (bestMatch ? s.id !== bestMatch.id : true))
                    .map((staff) => (
                      <SelectItemRich
                        key={staff.id}
                        value={staff.id}
                        text={staff.name}
                      >
                        <div className="flex flex-col">
                          <div className="text-[#222222] font-semibold" style={{ fontSize: '13px' }}>
                            {staff.name}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(staff.matchingSubjects ?? []).slice(0, 6).map((subject: string, idx: number) => (
                              <Badge key={`${staff.id}-${subject}-${idx}`} className="bg-[#e6f7f6] text-[#4db4ac]" style={{ fontSize: '10px' }}>
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </SelectItemRich>
                    ))
                ) : (
                  <SelectItem value="none" disabled>
                    No substitute staff available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {!loadingSubs && allSelectableSubstitutes.length > 0 && !bestMatch && (
              <p className="text-[#777777] mt-2" style={{ fontSize: '12px' }}>
                No subject-based suggestion found. You can still select any substitute staff member.
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
                      Matching subjects: {calculateMatchingSubjects(selected).join(', ') || '—'}
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
            disabled={allSelectableSubstitutes.length === 0}
          >
            Submit Leave Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}