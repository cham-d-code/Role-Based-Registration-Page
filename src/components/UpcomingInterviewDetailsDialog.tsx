import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar, Users, Play, Edit, Mail, Phone, FileText } from 'lucide-react';
import { Card } from './ui/card';

interface InterviewCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface UpcomingInterviewDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewNumber: string;
  interviewDate: string;
  candidates: InterviewCandidate[];
  onUpdateDate: (newDate: string) => void;
  onStartInterview: () => void;
}

export default function UpcomingInterviewDetailsDialog({
  open,
  onOpenChange,
  interviewNumber,
  interviewDate,
  candidates,
  onUpdateDate,
  onStartInterview
}: UpcomingInterviewDetailsDialogProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(interviewDate);

  const handleSaveDate = () => {
    onUpdateDate(newDate);
    setIsEditingDate(false);
  };

  const handleStart = () => {
    onStartInterview();
    onOpenChange(false);
  };

  // Calculate days until interview
  const calculateDaysUntil = () => {
    const interviewDateObj = new Date(interviewDate);
    const today = new Date();
    const diffTime = interviewDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 'N/A' : diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            <Calendar className="h-6 w-6 text-[#4db4ac]" />
            {interviewNumber} - Upcoming Interview
          </DialogTitle>
          <DialogDescription className="text-[#555555]">
            Manage interview details and view candidate list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Interview Date Management */}
          <Card className="border-2 border-[#4db4ac] rounded-lg p-4 bg-[#e6f7f6]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-[#4db4ac]" />
                  <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Interview Date
                  </Label>
                </div>
                
                {isEditingDate ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="max-w-xs bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                    />
                    <Button
                      onClick={handleSaveDate}
                      className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewDate(interviewDate);
                        setIsEditingDate(false);
                      }}
                      className="border-[#d0d0d0] text-[#555555]"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>
                      {new Date(interviewDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingDate(true)}
                      className="border-[#4db4ac] text-[#4db4ac] hover:bg-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Date
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            </div>
          </Card>

          <Separator />

          {/* Candidate Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Total Candidates
              </p>
              <p className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                {candidates.length}
              </p>
            </Card>
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Interview Status
              </p>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                UPCOMING
              </Badge>
            </Card>
            <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
              <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                Days Until Interview
              </p>
              <p className="text-[#4db4ac]" style={{ fontSize: '24px', fontWeight: 700 }}>
                {calculateDaysUntil()}
              </p>
            </Card>
          </div>

          {/* Candidates List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-[#4db4ac]" />
              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                Candidates for This Interview
              </h4>
            </div>

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9f9f9]">
                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>#</TableHead>
                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Candidate ID</TableHead>
                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Name</TableHead>
                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Email</TableHead>
                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Phone</TableHead>
                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>CV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate, index) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="text-[#555555] py-2" style={{ fontSize: '13px' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {candidate.id}
                      </TableCell>
                      <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {candidate.name}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                          <Mail className="h-3 w-3 text-[#4db4ac]" />
                          {candidate.email}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                          <Phone className="h-3 w-3 text-[#4db4ac]" />
                          {candidate.phone}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                          onClick={() => alert(`Viewing CV for ${candidate.name}`)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View CV
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {candidates.length === 0 && (
              <div className="text-center py-12 text-[#999999] border border-[#e0e0e0] rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p style={{ fontSize: '14px' }}>No candidates scheduled for this interview</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#d0d0d0] text-[#555555]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}