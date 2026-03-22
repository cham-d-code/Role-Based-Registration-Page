import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface AttendanceRecord {
  date: string;
  module: string;
  session: string;
  status: 'present' | 'absent' | 'late';
  hours: number;
  remarks?: string;
}

interface StaffAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  staffId: string;
}

export default function StaffAttendanceDialog({ 
  open, 
  onOpenChange, 
  staffName,
  staffId 
}: StaffAttendanceDialogProps) {
  
  // Mock attendance data - in real app, this would be fetched based on staffId
  const attendanceRecords: AttendanceRecord[] = [
    { date: 'Oct 18, 2025', module: 'Marketing Management', session: 'Tutorial 1', status: 'present', hours: 2 },
    { date: 'Oct 17, 2025', module: 'Marketing Management', session: 'Lecture 5', status: 'present', hours: 2 },
    { date: 'Oct 15, 2025', module: 'Marketing Management', session: 'Tutorial 2', status: 'late', hours: 1.5, remarks: 'Arrived 30 mins late' },
    { date: 'Oct 14, 2025', module: 'Marketing Management', session: 'Lecture 4', status: 'present', hours: 2 },
    { date: 'Oct 11, 2025', module: 'Marketing Management', session: 'Tutorial 1', status: 'present', hours: 2 },
    { date: 'Oct 10, 2025', module: 'Marketing Management', session: 'Lecture 3', status: 'present', hours: 2 },
    { date: 'Oct 8, 2025', module: 'Marketing Management', session: 'Tutorial Session', status: 'absent', hours: 0, remarks: 'Medical leave' },
    { date: 'Oct 7, 2025', module: 'Marketing Management', session: 'Lecture 2', status: 'present', hours: 2 },
  ];

  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalHours = attendanceRecords.reduce((sum, r) => sum + r.hours, 0);
  const attendanceRate = ((presentCount + lateCount) / totalSessions * 100).toFixed(1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 border-green-300 border">Present</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300 border">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 border-red-300 border">Absent</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            Attendance Summary
          </DialogTitle>
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            {staffName}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-500 border-l-4 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <p className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Present Days
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '36px', fontWeight: 700 }}>
                {presentCount + lateCount}
              </p>
              <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                Including {lateCount} late arrival{lateCount !== 1 ? 's' : ''}
              </p>
            </Card>

            <Card className="bg-red-50 border-red-500 border-l-4 p-6">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="h-6 w-6 text-red-600" />
                <p className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Absent Days
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '36px', fontWeight: 700 }}>
                {absentCount}
              </p>
              <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                Out of {totalSessions} total sessions
              </p>
            </Card>
          </div>

          <Separator />

          {/* Attendance Records Table */}
          <div>
            <h3 className="text-[#222222] mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
              Recent Attendance Records
            </h3>
            
            <div className="space-y-2">
              {attendanceRecords.map((record, index) => (
                <Card key={index} className="border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-[#4db4ac]" />
                      <div>
                        <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {record.date}
                        </p>
                        <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                          {record.module} - {record.session}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(record.status)}
                      {record.remarks && (
                        <p className="text-[#999999] mt-1" style={{ fontSize: '11px' }}>
                          {record.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
