import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Mail,
  CheckCircle,
  Calendar,
  Users,
  Award,
  TrendingUp,
  Check,
  X
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

interface HodEndedInterviewApprovalPageProps {
  interview: Interview;
  onBack: () => void;
}

export default function HodEndedInterviewApprovalPage({ interview, onBack }: HodEndedInterviewApprovalPageProps) {
  const [approved, setApproved] = useState(false);
  
  const candidates = interview.candidates || [];
  const sortedCandidates = [...candidates].sort((a, b) => b.marks.total - a.marks.total);
  const shortlistedCandidates = sortedCandidates.filter(c => c.shortlisted);

  const handleApprove = () => {
    alert(`Interview results approved successfully!\\n${shortlistedCandidates.length} candidates will be notified.`);
    setApproved(true);
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this interview shortlist? The coordinator will need to revise the selection.')) {
      alert('Interview results rejected. The coordinator has been notified to revise the shortlist.');
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-white">
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
            {interview.interviewNumber} - Approval Review
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
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#4db4ac]" />
              <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '22px' }}>
                Interview Report Summary
              </h2>
            </div>
            <Badge className={`${approved ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'} border`}>
              {approved ? 'APPROVED' : 'PENDING APPROVAL'}
            </Badge>
          </div>
          
          <Separator className="mb-6" />

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  INTERVIEW DATE
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                {new Date(interview.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  TOTAL CANDIDATES
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                {candidates.length}
              </p>
            </div>

            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  AVERAGE MARKS
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                {interview.averageMarks?.toFixed(1) || 'N/A'}
              </p>
            </div>

            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  SHORTLISTED
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                {shortlistedCandidates.length}
              </p>
            </div>
          </div>

          {/* Approval Decision Box */}
          {!approved && (
            <div className="bg-[#fff8e1] border-2 border-[#ffd54f] rounded-lg p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Approval Required
                  </h3>
                  <p className="text-[#555555]" style={{ fontSize: '14px' }}>
                    Please review the interview results and shortlisted candidates below. Approve to finalize the selection or reject to request revisions from the coordinator.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="border-2 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Results
                  </Button>
                </div>
              </div>
            </div>
          )}

          {approved && (
            <div className="bg-[#e8f5e9] border-2 border-[#66bb6a] rounded-lg p-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="text-[#222222] mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Interview Results Approved
                  </h3>
                  <p className="text-[#555555]" style={{ fontSize: '14px' }}>
                    The shortlisted candidates have been notified via email. The coordinator can proceed with the next steps.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Shortlisted Candidates */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '18px' }}>
              Shortlisted Candidates ({shortlistedCandidates.length})
            </h3>
            <Badge className="bg-green-100 text-green-700 border-green-300 border">
              RECOMMENDED FOR HIRING
            </Badge>
          </div>
          
          <Separator className="mb-4" />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9f9f9]">
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Rank
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Candidate Name
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Email
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Phone
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Part 1
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Part 2
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Part 3
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortlistedCandidates.map((candidate, index) => (
                  <TableRow key={candidate.id} className="hover:bg-[#f9f9f9]">
                    <TableCell>
                      <Badge className="bg-[#4db4ac] text-white">
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {candidate.name}
                    </TableCell>
                    <TableCell className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {candidate.email}
                    </TableCell>
                    <TableCell className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {candidate.phone}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px' }}>
                      {candidate.marks.part1}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px' }}>
                      {candidate.marks.part2}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px' }}>
                      {candidate.marks.part3}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border-green-300 border" style={{ fontSize: '13px', fontWeight: 700 }}>
                        {candidate.marks.total}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* All Candidates Performance */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[#4db4ac]" />
            <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '18px' }}>
              Complete Candidate Ranking ({candidates.length})
            </h3>
          </div>
          
          <Separator className="mb-4" />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9f9f9]">
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Rank
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Candidate Name
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Email
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Phone
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Part 1
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Part 2
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Part 3
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Total
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCandidates.map((candidate, index) => (
                  <TableRow key={candidate.id} className={`hover:bg-[#f9f9f9] ${candidate.shortlisted ? 'bg-green-50/50' : ''}`}>
                    <TableCell>
                      <div className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                        #{index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {candidate.name}
                    </TableCell>
                    <TableCell className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {candidate.email}
                    </TableCell>
                    <TableCell className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {candidate.phone}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px' }}>
                      {candidate.marks.part1}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px' }}>
                      {candidate.marks.part2}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px' }}>
                      {candidate.marks.part3}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {candidate.marks.total}
                    </TableCell>
                    <TableCell className="text-center">
                      {candidate.shortlisted ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 border">
                          Shortlisted
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 border-gray-300 border">
                          Not Selected
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
