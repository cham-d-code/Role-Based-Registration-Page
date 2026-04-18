import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { isWorkingDay } from './attendanceUtils';

interface AttendanceRecord {
  date: string;
  markedTime?: string;
  status: 'present' | 'absent';
  remarks?: string;
}

interface StaffAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  staffId: string;
  periodStart?: Date;
  periodEnd?: Date;
  periodLabel?: string;
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    weekday: 'short',
  });
}

function formatTime(hours: number, minutes: number): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function buildRecords(staffId: string, start: Date, end: Date): AttendanceRecord[] {
  const seed = seedFromString(staffId || 'x');
  const records: AttendanceRecord[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endT = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  let i = 0;
  while (cursor.getTime() < endT) {
    if (isWorkingDay(cursor)) {
      const isAbsent = (seed + i) % 10 === 0;
      // deterministic "marked" time around 8:00-9:15 AM
      const minuteShift = (seed + i * 7) % 75; // 0-74
      const hour = 8 + Math.floor(minuteShift / 60);
      const minute = minuteShift % 60;
      records.push({
        date: formatDate(new Date(cursor)),
        markedTime: isAbsent ? undefined : formatTime(hour, minute),
        status: isAbsent ? 'absent' : 'present',
        remarks: isAbsent ? 'Leave / Absent' : undefined,
      });
      i++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return records.reverse();
}

export default function StaffAttendanceDialog({
  open,
  onOpenChange,
  staffName,
  staffId,
  periodStart,
  periodEnd,
  periodLabel,
}: StaffAttendanceDialogProps) {
  // Fallback: current month 10th -> next month 10th
  const now = new Date();
  const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 10);
  const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 10);
  const start = periodStart ?? fallbackStart;
  const end = periodEnd ?? fallbackEnd;

  const attendanceRecords = buildRecords(staffId, start, end);

  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 border-green-300 border">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 border-red-300 border">Absent</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            Attendance Summary
          </DialogTitle>
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            {staffName}
          </p>
          {periodLabel && (
            <p className="text-[#777777]" style={{ fontSize: '12px' }}>
              Period: {periodLabel}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-500 border-l-4 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <p className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Present Days
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '36px', fontWeight: 700 }}>
                {presentCount}
              </p>
              <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                Out of {totalSessions} working days
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
                Out of {totalSessions} working days
              </p>
            </Card>
          </div>

          <Separator />

          <div>
            <h3 className="text-[#222222] mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
              Recent Attendance Records
            </h3>

            <div className="space-y-2">
              {attendanceRecords.length === 0 && (
                <p className="text-[#999999] text-center py-6" style={{ fontSize: '13px' }}>
                  No attendance records for this period.
                </p>
              )}
              {attendanceRecords.map((record, index) => (
                <Card key={index} className="border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-[#4db4ac]" />
                      <div>
                        <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {record.date}
                        </p>
                        {record.markedTime && (
                          <p className="text-[#777777] flex items-center gap-1 mt-0.5" style={{ fontSize: '12px' }}>
                            <Clock className="h-3.5 w-3.5" />
                            Marked at {record.markedTime}
                          </p>
                        )}
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
