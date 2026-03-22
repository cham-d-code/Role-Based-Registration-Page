import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface MarkingCriteria {
  id: string;
  criterion: string;
  maxMarks: number;
}

interface Interview {
  id: string;
  interviewNumber: string;
  date: string;
  status: 'upcoming' | 'ended';
  candidateCount: number;
}

interface MarkingSchemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (scheme: { interviewId: string; interviewNumber: string; criteria: MarkingCriteria[] }) => void;
  interviews: Interview[];
}

export default function MarkingSchemeDialog({ open, onOpenChange, onSave, interviews }: MarkingSchemeDialogProps) {
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [criteria, setCriteria] = useState<MarkingCriteria[]>([
    { id: '1', criterion: '', maxMarks: 0 }
  ]);

  const addCriterion = () => {
    setCriteria([...criteria, { id: Date.now().toString(), criterion: '', maxMarks: 0 }]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter(c => c.id !== id));
    }
  };

  const updateCriterion = (id: string, field: 'criterion' | 'maxMarks', value: string | number) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = () => {
    const selectedInterview = interviews.find(i => i.id === selectedInterviewId);
    if (selectedInterviewId && selectedInterview && criteria.every(c => c.criterion && c.maxMarks > 0)) {
      onSave({ 
        interviewId: selectedInterviewId,
        interviewNumber: selectedInterview.interviewNumber,
        criteria 
      });
      setSelectedInterviewId('');
      setCriteria([{ id: '1', criterion: '', maxMarks: 0 }]);
      onOpenChange(false);
    } else {
      alert('Please select an interview and fill in all fields with valid values!');
    }
  };

  const totalMarks = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);

  // Filter only upcoming interviews
  const upcomingInterviews = interviews.filter(i => i.status === 'upcoming');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
            Create Marking Scheme (FR2)
          </DialogTitle>
          <DialogDescription className="text-[#555555]">
            Select an upcoming interview and define the evaluation criteria and maximum marks for each criterion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="interview-select" className="text-[#555555]">Select Interview</Label>
            <Select value={selectedInterviewId} onValueChange={setSelectedInterviewId}>
              <SelectTrigger className="mt-1 border-[#d0d0d0] focus:border-[#4db4ac]">
                <SelectValue placeholder="Select an upcoming interview" />
              </SelectTrigger>
              <SelectContent>
                {upcomingInterviews.map((interview) => (
                  <SelectItem key={interview.id} value={interview.id}>
                    {interview.interviewNumber} - {interview.date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[#555555]">Evaluation Criteria</Label>
              <Button
                type="button"
                onClick={addCriterion}
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                style={{ fontSize: '12px' }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Criterion
              </Button>
            </div>

            <div className="space-y-3">
              {criteria.map((criterion, index) => (
                <div key={criterion.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      value={criterion.criterion}
                      onChange={(e) => updateCriterion(criterion.id, 'criterion', e.target.value)}
                      placeholder="e.g., Technical Knowledge"
                      className="border-[#d0d0d0] focus:border-[#4db4ac]"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      value={criterion.maxMarks || ''}
                      onChange={(e) => updateCriterion(criterion.id, 'maxMarks', Number(e.target.value))}
                      placeholder="Max Marks"
                      className="border-[#d0d0d0] focus:border-[#4db4ac]"
                      min="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeCriterion(criterion.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                    disabled={criteria.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-[#e6f7f6] rounded-lg">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                Total Maximum Marks: {totalMarks}
              </p>
            </div>
          </div>
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
            onClick={handleSave}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
          >
            Save & Publish Scheme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}