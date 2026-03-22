import { useState } from 'react';
import { ArrowLeft, Download, Search, Calendar, DollarSign, CheckCircle, XCircle, Users, TrendingUp, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AttendanceAndSalariesPageProps {
  onBack: () => void;
}

interface StaffAttendance {
  id: string;
  name: string;
  email: string;

  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  monthlyEarnings: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AttendanceAndSalariesPage({ onBack }: AttendanceAndSalariesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('October 2025');

  const [staffData, setStaffData] = useState<StaffAttendance[]>([
    {
      id: 'STAFF001',
      name: 'Mr. Saman Perera',
      email: 'saman.perera@kln.ac.lk',
      totalDays: 22,
      presentDays: 20,
      absentDays: 2,
      attendanceRate: 90.9,
      monthlyEarnings: 240000,
      status: 'pending'
    },
    {
      id: 'STAFF002',
      name: 'Ms. Nisha Fernando',
      email: 'nisha.fernando@kln.ac.lk',
      totalDays: 22,
      presentDays: 22,
      absentDays: 0,
      attendanceRate: 100,
      monthlyEarnings: 281600,
      status: 'pending'
    },
    {
      id: 'STAFF003',
      name: 'Mr. Kamal Silva',
      email: 'kamal.silva@kln.ac.lk',
      totalDays: 22,
      presentDays: 18,
      absentDays: 4,
      attendanceRate: 81.8,
      monthlyEarnings: 216000,
      status: 'approved'
    },
    {
      id: 'STAFF004',
      name: 'Ms. Priya Jayawardena',
      email: 'priya.j@kln.ac.lk',
      totalDays: 22,
      presentDays: 21,
      absentDays: 1,
      attendanceRate: 95.5,
      monthlyEarnings: 285600,
      status: 'pending'
    },
    {
      id: 'STAFF005',
      name: 'Mr. Dilshan Perera',
      email: 'dilshan.p@kln.ac.lk',
      totalDays: 22,
      presentDays: 19,
      absentDays: 3,
      attendanceRate: 86.4,
      monthlyEarnings: 273600,
      status: 'pending'
    },
    {
      id: 'STAFF006',
      name: 'Ms. Chamari Wickramasinghe',
      email: 'chamari.w@kln.ac.lk',
      totalDays: 22,
      presentDays: 22,
      absentDays: 0,
      attendanceRate: 100,
      monthlyEarnings: 290400,
      status: 'approved'
    },
    {
      id: 'STAFF007',
      name: 'Mr. Ruwan Bandara',
      email: 'ruwan.b@kln.ac.lk',
      totalDays: 22,
      presentDays: 20,
      absentDays: 2,
      attendanceRate: 90.9,
      monthlyEarnings: 304000,
      status: 'pending'
    }
  ]);

  // Calculate summary statistics
  const totalStaff = staffData.length;
  const averageAttendance = (staffData.reduce((sum, staff) => sum + staff.attendanceRate, 0) / totalStaff).toFixed(1);
  const totalPayroll = staffData.reduce((sum, staff) => sum + staff.monthlyEarnings, 0);

  // Filter data
  const filteredData = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleApprove = (staffId: string) => {
    setStaffData(prev =>
      prev.map(staff => staff.id === staffId ? { ...staff, status: 'approved' as const } : staff)
    );
    alert('Attendance and salary approved successfully!');
  };

  const handleReject = (staffId: string) => {
    setStaffData(prev =>
      prev.map(staff => staff.id === staffId ? { ...staff, status: 'rejected' as const } : staff)
    );
    alert('Attendance and salary rejected.');
  };

  const handleExportReport = () => {
    alert('Exporting attendance and salary report...');
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-blue-600';
    if (rate >= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#e0e0e0] fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="text-[#4db4ac] hover:text-[#3c9a93] hover:bg-[#e6f7f6]"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                Attendance & Salaries Management
              </h1>
            </div>
            <Button
              onClick={handleExportReport}
              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 border-t-4 border-t-[#4db4ac] p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-[#4db4ac]" />
              <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>
                Total Staff
              </p>
            </div>
            <p className="text-[#222222]" style={{ fontSize: '32px', fontWeight: 700 }}>
              {totalStaff}
            </p>
          </Card>

          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 border-t-4 border-t-green-500 p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>
                Avg. Attendance
              </p>
            </div>
            <p className="text-[#222222]" style={{ fontSize: '32px', fontWeight: 700 }}>
              {averageAttendance}%
            </p>
          </Card>

          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 border-t-4 border-t-blue-500 p-5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>
                Total Payroll
              </p>
            </div>
            <p className="text-[#222222]" style={{ fontSize: '32px', fontWeight: 700 }}>
              LKR {(totalPayroll / 1000).toFixed(0)}K
            </p>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Calendar className="h-5 w-5 text-[#4db4ac]" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] border-[#e0e0e0] focus:border-[#4db4ac]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="October 2025">October 2025</SelectItem>
                  <SelectItem value="September 2025">September 2025</SelectItem>
                  <SelectItem value="August 2025">August 2025</SelectItem>
                  <SelectItem value="July 2025">July 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 md:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999999]" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#e0e0e0] focus:border-[#4db4ac]"
              />
            </div>
          </div>
        </Card>

        {/* Staff Table */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9f9f9] border-b border-[#e0e0e0]">
                  <TableHead className="text-[#222222]" style={{ fontWeight: 600 }}>Staff Member</TableHead>

                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Attendance</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Days</TableHead>
                  <TableHead className="text-[#222222] text-right" style={{ fontWeight: 600 }}>Earnings</TableHead>
                  <TableHead className="text-[#222222] text-center" style={{ fontWeight: 600 }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((staff) => (
                  <TableRow key={staff.id} className="border-b border-[#e0e0e0] hover:bg-[#f9f9f9]">
                    <TableCell>
                      <div>
                        <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {staff.name}
                        </p>
                        <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                          {staff.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`${getAttendanceColor(staff.attendanceRate)}`} style={{ fontSize: '16px', fontWeight: 700 }}>
                          {staff.attendanceRate}%
                        </span>
                        <div className="w-full max-w-[80px] h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4db4ac] rounded-full"
                            style={{ width: `${staff.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600" style={{ fontSize: '13px', fontWeight: 600 }}>
                            {staff.presentDays}
                          </span>
                          <span className="text-[#999999]" style={{ fontSize: '11px' }}>/</span>
                          <span className="text-red-600" style={{ fontSize: '13px', fontWeight: 600 }}>
                            {staff.absentDays}
                          </span>
                        </div>
                        <p className="text-[#999999]" style={{ fontSize: '11px' }}>
                          of {staff.totalDays}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                        LKR {staff.monthlyEarnings.toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {staff.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(staff.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(staff.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className={`text-[12px] ${staff.status === 'approved' ? 'text-green-600' : 'text-red-600'}`} style={{ fontWeight: 600 }}>
                            {staff.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-[#999999]">
              <FileText className="h-12 w-12 mx-auto mb-3 text-[#cccccc]" />
              <p style={{ fontSize: '14px' }}>No staff members found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
