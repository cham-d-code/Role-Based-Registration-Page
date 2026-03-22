import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Mail,
  CheckCircle,
  Save,
  Send
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  cvUrl?: string;
  marks: {
    part1: number;
    part2: number;
    part3: number;
    total: number;
  };
  shortlisted: boolean;
}

interface Interview {
  id: string;
  interviewNumber: string;
  date: string;
  candidateCount: number;
  averageMarks?: number;
  passedCandidates?: number;
  candidates?: Candidate[];
}

interface EndedInterviewDetailsPageProps {
  interview: Interview;
  onBack: () => void;
}

export default function EndedInterviewDetailsPage({ interview, onBack }: EndedInterviewDetailsPageProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(
    new Set(interview.candidates?.filter(c => c.shortlisted).map(c => c.id) || [])
  );

  const candidates = interview.candidates || [];
  const sortedCandidates = [...candidates].sort((a, b) => b.marks.total - a.marks.total);

  const toggleCandidate = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSaveShortlist = () => {
    alert(`Shortlist saved successfully!\n${selectedCandidates.size} candidates selected.`);
  };

  const handleSendForApproval = () => {
    if (selectedCandidates.size === 0) {
      alert('Please select at least one candidate before sending for approval.');
      return;
    }
    alert(`Sending shortlist of ${selectedCandidates.size} candidates to HOD for approval...\n\nThe HOD will review and approve the shortlisted candidates.`);
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
            {interview.interviewNumber} - Full Report
          </h1>
        </div>
        
        <Button
          variant="ghost"
          className="text-white hover:bg-[#3c9a93]"
          onClick={() => alert('Downloading report...')}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </header>

      <div className="pt-20 pb-8 px-6 max-w-7xl mx-auto">
        {/* Interview Summary */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '24px' }}>
                {interview.interviewNumber}
              </h2>
              <p className="text-[#555555] mt-1" style={{ fontSize: '14px' }}>
                Conducted on {interview.date}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300 border" style={{ fontSize: '12px' }}>
              COMPLETED
            </Badge>
          </div>

          <Separator className="my-4" />

          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Total Candidates
              </p>
              <p className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                {interview.candidateCount}
              </p>
            </Card>
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Shortlisted
              </p>
              <p className="text-green-600" style={{ fontSize: '24px', fontWeight: 700 }}>
                {selectedCandidates.size}
              </p>
            </Card>
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Average Marks
              </p>
              <p className="text-[#4db4ac]" style={{ fontSize: '24px', fontWeight: 700 }}>
                {interview.averageMarks}
              </p>
            </Card>
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Pass Rate
              </p>
              <p className="text-[#4db4ac]" style={{ fontSize: '24px', fontWeight: 700 }}>
                {selectedCandidates.size && interview.candidateCount 
                  ? Math.round((selectedCandidates.size / interview.candidateCount) * 100)
                  : 0}%
              </p>
            </Card>
          </div>
        </Card>

        {/* Candidates List with Selection */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
              All Candidates - Select to Shortlist
            </h3>
            <Button
              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
              onClick={handleSaveShortlist}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Shortlist ({selectedCandidates.size})
            </Button>
          </div>
          <Separator className="mb-4" />

          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-4">
            <p className="text-blue-700" style={{ fontSize: '13px', fontWeight: 600 }}>
              💡 Select candidates by checking the boxes to add them to the shortlist. Currently {selectedCandidates.size} candidates selected.
            </p>
          </div>

          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9f9f9]">
                  <TableHead className="text-[#222222] w-12" style={{ fontWeight: 600 }}>
                    <Checkbox
                      checked={selectedCandidates.size === sortedCandidates.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCandidates(new Set(sortedCandidates.map(c => c.id)));
                        } else {
                          setSelectedCandidates(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Rank</TableHead>
                  <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Candidate ID</TableHead>
                  <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Name</TableHead>
                  <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Email</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Part 1</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Part 2</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Part 3</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Total</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>CV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCandidates.map((candidate, index) => {
                  const isSelected = selectedCandidates.has(candidate.id);
                  return (
                    <TableRow 
                      key={candidate.id} 
                      className={`${isSelected ? 'bg-green-50' : ''} hover:bg-[#f9f9f9] cursor-pointer`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCandidate(candidate.id)}
                        />
                      </TableCell>
                      <TableCell className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        #{index + 1}
                      </TableCell>
                      <TableCell className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {candidate.id}
                      </TableCell>
                      <TableCell className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        <div className="flex items-center gap-2">
                          {candidate.name}
                          {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                          <Mail className="h-3 w-3 text-[#4db4ac]" />
                          {candidate.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {candidate.marks.part1}
                      </TableCell>
                      <TableCell className="text-center text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {candidate.marks.part2}
                      </TableCell>
                      <TableCell className="text-center text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {candidate.marks.part3}
                      </TableCell>
                      <TableCell className="text-center">
                        <span 
                          className={isSelected ? 'text-green-600' : 'text-[#4db4ac]'} 
                          style={{ fontSize: '14px', fontWeight: 700 }}
                        >
                          {candidate.marks.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                          onClick={() => alert(`Viewing CV for ${candidate.name}`)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-between items-center gap-3">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white px-6"
              onClick={handleSendForApproval}
            >
              <Send className="h-4 w-4 mr-2" />
              Send for HOD Approval ({selectedCandidates.size})
            </Button>
            
            <Button
              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-6"
              onClick={handleSaveShortlist}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Shortlist ({selectedCandidates.size} candidates)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
