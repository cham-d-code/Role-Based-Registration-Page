import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  FileText, 
  Download, 
  Mail, 
  Award, 
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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

interface EndedInterviewDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview | null;
}

const EndedInterviewDetailsDialog = React.forwardRef<HTMLDivElement, EndedInterviewDetailsDialogProps>(
  ({ open, onOpenChange, interview }, ref) => {
    const [activeTab, setActiveTab] = useState('all');

    if (!interview) return null;

    const candidates = interview.candidates || [];
    const sortedCandidates = [...candidates].sort((a, b) => b.marks.total - a.marks.total);
    const shortlistedCandidates = sortedCandidates.filter(c => c.shortlisted);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          ref={ref}
          className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-[#222222]" style={{ fontWeight: 700, fontSize: '24px' }}>
                  {interview.interviewNumber} - Full Report
                </DialogTitle>
                <p className="text-[#555555] mt-1" style={{ fontSize: '14px' }}>
                  Conducted on {interview.date}
                </p>
              </div>
              <Button
                variant="outline"
                className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                onClick={() => alert('Downloading report...')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </DialogHeader>

          <Separator className="my-4" />

          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
                {interview.passedCandidates}
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
                {interview.passedCandidates && interview.candidateCount 
                  ? Math.round((interview.passedCandidates / interview.candidateCount) * 100)
                  : 0}%
              </p>
            </Card>
          </div>

          {/* Tabs for All Candidates vs Shortlisted */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#4db4ac] data-[state=active]:text-white">
                All Candidates ({candidates.length})
              </TabsTrigger>
              <TabsTrigger value="shortlisted" className="data-[state=active]:bg-[#4db4ac] data-[state=active]:text-white">
                Shortlisted ({shortlistedCandidates.length})
              </TabsTrigger>
            </TabsList>

            {/* All Candidates Tab */}
            <TabsContent value="all">
              <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f9f9f9]">
                      <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Rank</TableHead>
                      <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Candidate ID</TableHead>
                      <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Name</TableHead>
                      <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Email</TableHead>
                      <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Part 1</TableHead>
                      <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Part 2</TableHead>
                      <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Part 3</TableHead>
                      <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Total</TableHead>
                      <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Status</TableHead>
                      <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>CV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCandidates.map((candidate, index) => (
                      <TableRow key={candidate.id} className={candidate.shortlisted ? 'bg-green-50' : ''}>
                        <TableCell className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                          #{index + 1}
                        </TableCell>
                        <TableCell className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 500 }}>
                          {candidate.id}
                        </TableCell>
                        <TableCell className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {candidate.name}
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
                          <span className="text-[#4db4ac]" style={{ fontSize: '14px', fontWeight: 700 }}>
                            {candidate.marks.total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {candidate.shortlisted ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 border" style={{ fontSize: '10px' }}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              SHORTLISTED
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-300 border" style={{ fontSize: '10px' }}>
                              <XCircle className="h-3 w-3 mr-1" />
                              NOT SELECTED
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Shortlisted Candidates Tab */}
            <TabsContent value="shortlisted">
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg p-3">
                <Award className="h-5 w-5 text-green-600" />
                <p className="text-green-700" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Top {shortlistedCandidates.length} candidates selected in descending order by total marks
                </p>
              </div>

              <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50">
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
                    {shortlistedCandidates.map((candidate, index) => (
                      <TableRow key={candidate.id} className="bg-white hover:bg-green-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                            {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                            {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                            <span className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 700 }}>
                              #{index + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 500 }}>
                          {candidate.id}
                        </TableCell>
                        <TableCell className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {candidate.name}
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
                          <span className="text-green-600" style={{ fontSize: '14px', fontWeight: 700 }}>
                            {candidate.marks.total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => alert(`Viewing CV for ${candidate.name}`)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {shortlistedCandidates.length === 0 && (
                <div className="text-center py-12 text-[#999999]">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p style={{ fontSize: '14px' }}>No candidates were shortlisted for this interview</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
);

EndedInterviewDetailsDialog.displayName = 'EndedInterviewDetailsDialog';

export default EndedInterviewDetailsDialog;
