import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle2, XCircle, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

interface AttendanceRecord {
  staffId: string;
  staffName: string;
  week: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  taskCompletion: number;
  availability: 'Available' | 'Partially Available' | 'Unavailable';
}

interface AttendanceSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'hod' | 'coordinator';
}

export default function AttendanceSummaryDialog({ 
  open, 
  onOpenChange,
  userRole 
}: AttendanceSummaryDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState('October 2025');
  const [selectedStaff, setSelectedStaff] = useState('all');

  // FR20: Mock attendance data
  const attendanceData: AttendanceRecord[] = [
    {
      staffId: 'TS001',
      staffName: 'K.M. Silva',
      week: 'Week 1 (Oct 1-7)',
      totalDays: 5,
      presentDays: 5,
      absentDays: 0,
      taskCompletion: 100,
      availability: 'Available'
    },
    {
      staffId: 'TS001',
      staffName: 'K.M. Silva',
      week: 'Week 2 (Oct 8-14)',
      totalDays: 5,
      presentDays: 5,
      absentDays: 0,
      taskCompletion: 95,
      availability: 'Available'
    },
    {
      staffId: 'TS002',
      staffName: 'R.P. Fernando',
      week: 'Week 1 (Oct 1-7)',
      totalDays: 5,
      presentDays: 4,
      absentDays: 1,
      taskCompletion: 80,
      availability: 'Partially Available'
    },
    {
      staffId: 'TS002',
      staffName: 'R.P. Fernando',
      week: 'Week 2 (Oct 8-14)',
      totalDays: 5,
      presentDays: 3,
      absentDays: 2,
      taskCompletion: 60,
      availability: 'Partially Available'
    },
    {
      staffId: 'TS003',
      staffName: 'N.S. Perera',
      week: 'Week 1 (Oct 1-7)',
      totalDays: 5,
      presentDays: 5,
      absentDays: 0,
      taskCompletion: 100,
      availability: 'Available'
    }
  ];

  const handleDownloadReport = () => {
    toast.success('Attendance report downloaded successfully');
  };

  const filteredData = selectedStaff === 'all' 
    ? attendanceData 
    : attendanceData.filter(record => record.staffId === selectedStaff);

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'Available':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Available</Badge>;
      case 'Partially Available':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Partial</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700 border-red-300">Unavailable</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#4db4ac]" />
                Attendance Summary
              </DialogTitle>
              <DialogDescription>
                View and monitor attendance and task completion of temporary staff
              </DialogDescription>
            </div>
            <Badge className="bg-[#4db4ac] text-white">FR20</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="October 2025">October 2025</SelectItem>
                  <SelectItem value="September 2025">September 2025</SelectItem>
                  <SelectItem value="August 2025">August 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                Staff Member
              </label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff Members</SelectItem>
                  <SelectItem value="TS001">K.M. Silva</SelectItem>
                  <SelectItem value="TS002">R.P. Fernando</SelectItem>
                  <SelectItem value="TS003">N.S. Perera</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleDownloadReport}
                className="bg-[#4db4ac] hover:bg-[#3da39b] text-white rounded-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f5f5f5]">
                  <tr>
                    <th className="text-left p-3 text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Staff Member
                    </th>
                    <th className="text-left p-3 text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Week
                    </th>
                    <th className="text-center p-3 text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Present
                    </th>
                    <th className="text-center p-3 text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Absent
                    </th>
                    <th className="text-center p-3 text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Task Completion
                    </th>
                    <th className="text-center p-3 text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Availability
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record, index) => (
                    <tr key={index} className="border-t border-[#e0e0e0] hover:bg-[#f9f9f9]">
                      <td className="p-3 text-[#333333]" style={{ fontSize: '13px' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{record.staffName}</div>
                          <div className="text-[#999999]" style={{ fontSize: '11px' }}>{record.staffId}</div>
                        </div>
                      </td>
                      <td className="p-3 text-[#555555]" style={{ fontSize: '13px' }}>
                        {record.week}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>
                            {record.presentDays}/{record.totalDays}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>
                            {record.absentDays}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-[#e0e0e0] rounded-full h-2">
                            <div 
                              className="bg-[#4db4ac] h-2 rounded-full"
                              style={{ width: `${record.taskCompletion}%` }}
                            />
                          </div>
                          <span className="text-[#333333]" style={{ fontSize: '12px', fontWeight: 500 }}>
                            {record.taskCompletion}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getAvailabilityBadge(record.availability)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600" style={{ fontSize: '11px', fontWeight: 500 }}>
                Total Present Days
              </div>
              <div className="text-green-700 mt-1" style={{ fontSize: '24px', fontWeight: 600 }}>
                22
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600" style={{ fontSize: '11px', fontWeight: 500 }}>
                Total Absent Days
              </div>
              <div className="text-red-700 mt-1" style={{ fontSize: '24px', fontWeight: 600 }}>
                3
              </div>
            </div>
            <div className="bg-[#e6f7f6] border border-[#4db4ac] rounded-lg p-4">
              <div className="text-[#4db4ac]" style={{ fontSize: '11px', fontWeight: 500 }}>
                Avg Task Completion
              </div>
              <div className="text-[#4db4ac] mt-1" style={{ fontSize: '24px', fontWeight: 600 }}>
                87%
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
