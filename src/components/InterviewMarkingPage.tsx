import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, 
  FileText, 
  Save,
  Calendar as CalendarIcon,
  ChevronDown,
  User
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  cvUrl?: string;
}

interface InterviewMarkingPageProps {
  interview: {
    id: string;
    interviewNumber: string;
    date: string;
  };
  candidates: Candidate[];
  onBack: () => void;
}

export default function InterviewMarkingPage({ interview, candidates, onBack }: InterviewMarkingPageProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [marks, setMarks] = useState({
    part1: '',
    part2: '',
    part3: '',
  });
  const [additionalComments, setAdditionalComments] = useState('');

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const totalMarks = (parseInt(marks.part1 || '0') + parseInt(marks.part2 || '0') + parseInt(marks.part3 || '0'));

  const handleAssignMarks = () => {
    if (!selectedCandidateId) {
      alert('Please select a candidate');
      return;
    }
    if (!marks.part1 || !marks.part2 || !marks.part3) {
      alert('Please enter all marks');
      return;
    }

    alert(`Marks assigned successfully!\nCandidate: ${selectedCandidate?.name}\nTotal: ${totalMarks}\nComments: ${additionalComments || 'None'}`);
    
    // Reset form
    setMarks({ part1: '', part2: '', part3: '' });
    setAdditionalComments('');
    setSelectedCandidateId('');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white hover:bg-[#3c9a93]"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
          <Separator orientation="vertical" className="h-8 bg-white/30" />
          <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>
            {interview.interviewNumber} - Marking Assignment
          </h1>
        </div>
        
        <Badge className="bg-white text-[#4db4ac] border-0" style={{ fontSize: '12px', fontWeight: 600 }}>
          {interview.date}
        </Badge>
      </header>

      <div className="pt-20 pb-8 px-6 max-w-5xl mx-auto">
        {/* Interview Information */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-[#4db4ac]" />
            <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
              Interview Details
            </h2>
          </div>
          <Separator className="mb-4" />
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#f9f9f9] rounded-lg p-4 border border-[#e0e0e0]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Interview Name
              </p>
              <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                {interview.interviewNumber}
              </p>
            </div>
            <div className="bg-[#f9f9f9] rounded-lg p-4 border border-[#e0e0e0]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Interview Date
              </p>
              <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                {interview.date}
              </p>
            </div>
            <div className="bg-[#f9f9f9] rounded-lg p-4 border border-[#e0e0e0]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Total Candidates
              </p>
              <p className="text-[#4db4ac]" style={{ fontSize: '16px', fontWeight: 700 }}>
                {candidates.length}
              </p>
            </div>
          </div>
        </Card>

        {/* Candidate Selection */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-6 w-6 text-[#4db4ac]" />
            <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
              Select Candidate
            </h2>
          </div>
          <Separator className="mb-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                Candidate *
              </Label>
              <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                <SelectTrigger className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]">
                  <SelectValue placeholder="Select candidate to mark">
                    {selectedCandidate ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[#4db4ac]" style={{ fontWeight: 600 }}>{selectedCandidate.id}</span>
                        <span>-</span>
                        <span>{selectedCandidate.name}</span>
                      </div>
                    ) : (
                      'Select candidate to mark'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-[#4db4ac]" style={{ fontWeight: 600 }}>{candidate.id}</span>
                        <span>-</span>
                        <span>{candidate.name}</span>
                        <span className="text-[#999999]">({candidate.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6] w-full"
                disabled={!selectedCandidateId}
                onClick={() => alert(`Viewing CV for ${selectedCandidate?.name}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View CV
              </Button>
            </div>
          </div>

          {selectedCandidate && (
            <div className="mt-4 bg-[#e6f7f6] border border-[#4db4ac] rounded-lg p-4">
              <p className="text-[#4db4ac] mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                Selected Candidate Details:
              </p>
              <div className="grid grid-cols-3 gap-3 text-[#222222]" style={{ fontSize: '13px' }}>
                <div>
                  <span className="text-[#555555]">ID: </span>
                  <span style={{ fontWeight: 600 }}>{selectedCandidate.id}</span>
                </div>
                <div>
                  <span className="text-[#555555]">Email: </span>
                  <span>{selectedCandidate.email}</span>
                </div>
                <div>
                  <span className="text-[#555555]">Phone: </span>
                  <span>{selectedCandidate.phone}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Marking Assignment Form */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-[#4db4ac]" />
            <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
              Marking Assignment
            </h2>
          </div>
          <Separator className="mb-4" />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                Part 1 Marks (Max: 30) *
              </Label>
              <Input
                type="number"
                min="0"
                max="30"
                placeholder="0"
                value={marks.part1}
                onChange={(e) => setMarks({ ...marks, part1: e.target.value })}
                className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
              />
            </div>
            <div>
              <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                Part 2 Marks (Max: 30) *
              </Label>
              <Input
                type="number"
                min="0"
                max="30"
                placeholder="0"
                value={marks.part2}
                onChange={(e) => setMarks({ ...marks, part2: e.target.value })}
                className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
              />
            </div>
            <div>
              <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                Part 3 Marks (Max: 40) *
              </Label>
              <Input
                type="number"
                min="0"
                max="40"
                placeholder="0"
                value={marks.part3}
                onChange={(e) => setMarks({ ...marks, part3: e.target.value })}
                className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
              />
            </div>
          </div>

          <div className="bg-[#4db4ac] bg-opacity-10 border-2 border-[#4db4ac] rounded-lg p-4">
            <p className="text-[#4db4ac] mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
              Total Marks
            </p>
            <p className="text-[#4db4ac]" style={{ fontSize: '32px', fontWeight: 700 }}>
              {totalMarks} / 100
            </p>
          </div>
        </Card>

        {/* Additional Comments */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
            Additional Comments
          </h3>
          <Separator className="mb-4" />

          <Textarea
            placeholder="Enter any additional comments or observations about the candidate's performance..."
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            className="w-full min-h-[120px] bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
            style={{ fontSize: '14px' }}
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            className="border-[#d0d0d0] text-[#555555] hover:bg-[#f0f0f0] px-6"
            onClick={onBack}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-6"
            onClick={handleAssignMarks}
          >
            <Save className="h-4 w-4 mr-2" />
            Assign Marks
          </Button>
        </div>
      </div>
    </div>
  );
}
