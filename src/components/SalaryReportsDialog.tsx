import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DollarSign, Download, Send, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface SalaryReport {
  staffId: string;
  staffName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  workingDays: number;
  status: 'Pending Approval' | 'Approved' | 'Sent to HOD';
  approvalDate: string;
}

interface SalaryReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'hod' | 'coordinator';
}

export default function SalaryReportsDialog({ 
  open, 
  onOpenChange,
  userRole 
}: SalaryReportsDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState('October 2025');

  // FR21: Mock salary report data
  const salaryReports: SalaryReport[] = [
    {
      staffId: 'TS001',
      staffName: 'K.M. Silva',
      month: 'October 2025',
      basicSalary: 45000,
      allowances: 5000,
      deductions: 2000,
      netSalary: 48000,
      workingDays: 22,
      status: userRole === 'coordinator' ? 'Sent to HOD' : 'Pending Approval',
      approvalDate: 'Oct 31, 2025'
    },
    {
      staffId: 'TS002',
      staffName: 'R.P. Fernando',
      month: 'October 2025',
      basicSalary: 42000,
      allowances: 4500,
      deductions: 1800,
      netSalary: 44700,
      workingDays: 20,
      status: userRole === 'coordinator' ? 'Sent to HOD' : 'Pending Approval',
      approvalDate: 'Oct 31, 2025'
    },
    {
      staffId: 'TS003',
      staffName: 'N.S. Perera',
      month: 'October 2025',
      basicSalary: 48000,
      allowances: 6000,
      deductions: 2200,
      netSalary: 51800,
      workingDays: 22,
      status: userRole === 'coordinator' ? 'Sent to HOD' : 'Approved',
      approvalDate: 'Oct 31, 2025'
    }
  ];

  const handleDownloadReport = (staffName: string) => {
    toast.success(`Salary report for ${staffName} downloaded`);
  };

  const handleSendToHOD = () => {
    toast.success('All salary reports sent to Head of Department for approval');
  };

  const handleApproveReport = (staffName: string) => {
    toast.success(`Salary report for ${staffName} approved`);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
      case 'Sent to HOD':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Sent to HOD</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#4db4ac]" />
                Salary Reports
              </DialogTitle>
              <DialogDescription>
                {userRole === 'hod' 
                  ? 'Review and approve salary reports for temporary staff'
                  : 'View and send salary reports to Head of Department'}
              </DialogDescription>
            </div>
            <Badge className="bg-[#4db4ac] text-white">FR21</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex-1 max-w-xs">
              <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                Select Month
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

            {userRole === 'coordinator' && (
              <div className="flex items-end">
                <Button 
                  onClick={handleSendToHOD}
                  className="bg-[#4db4ac] hover:bg-[#3da39b] text-white rounded-lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send All to HOD
                </Button>
              </div>
            )}
          </div>

          {/* Salary Reports Table */}
          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-[#f5f5f5]">
                <TableRow>
                  <TableHead className="text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Staff Member
                  </TableHead>
                  <TableHead className="text-right text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Basic Salary
                  </TableHead>
                  <TableHead className="text-right text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Allowances
                  </TableHead>
                  <TableHead className="text-right text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Deductions
                  </TableHead>
                  <TableHead className="text-right text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Net Salary
                  </TableHead>
                  <TableHead className="text-center text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Days
                  </TableHead>
                  <TableHead className="text-center text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Status
                  </TableHead>
                  <TableHead className="text-right text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryReports.map((report, index) => (
                  <TableRow key={index} className="hover:bg-[#f9f9f9]">
                    <TableCell>
                      <div>
                        <div className="text-[#333333]" style={{ fontSize: '13px', fontWeight: 500 }}>
                          {report.staffName}
                        </div>
                        <div className="text-[#999999]" style={{ fontSize: '11px' }}>
                          {report.staffId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[#555555]" style={{ fontSize: '13px' }}>
                      {formatCurrency(report.basicSalary)}
                    </TableCell>
                    <TableCell className="text-right text-green-600" style={{ fontSize: '13px' }}>
                      +{formatCurrency(report.allowances)}
                    </TableCell>
                    <TableCell className="text-right text-red-600" style={{ fontSize: '13px' }}>
                      -{formatCurrency(report.deductions)}
                    </TableCell>
                    <TableCell className="text-right text-[#333333]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {formatCurrency(report.netSalary)}
                    </TableCell>
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '13px' }}>
                      {report.workingDays}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReport(report.staffName)}
                          className="border-[#cccccc] hover:border-[#4db4ac] hover:bg-[#e6f7f6] rounded-lg"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {userRole === 'hod' && report.status === 'Pending Approval' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveReport(report.staffName)}
                            className="bg-[#4db4ac] hover:bg-[#3da39b] text-white rounded-lg"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="bg-[#f5f5f5] border border-[#e0e0e0] rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-[#999999]" style={{ fontSize: '11px', fontWeight: 500 }}>
                  Total Staff
                </div>
                <div className="text-[#333333] mt-1" style={{ fontSize: '18px', fontWeight: 600 }}>
                  {salaryReports.length}
                </div>
              </div>
              <div>
                <div className="text-[#999999]" style={{ fontSize: '11px', fontWeight: 500 }}>
                  Total Salary
                </div>
                <div className="text-[#333333] mt-1" style={{ fontSize: '18px', fontWeight: 600 }}>
                  {formatCurrency(salaryReports.reduce((sum, r) => sum + r.netSalary, 0))}
                </div>
              </div>
              <div>
                <div className="text-[#999999]" style={{ fontSize: '11px', fontWeight: 500 }}>
                  Approval Date
                </div>
                <div className="text-[#333333] mt-1" style={{ fontSize: '18px', fontWeight: 600 }}>
                  Oct 31
                </div>
              </div>
              <div>
                <div className="text-[#999999]" style={{ fontSize: '11px', fontWeight: 500 }}>
                  Approved
                </div>
                <div className="text-green-600 mt-1" style={{ fontSize: '18px', fontWeight: 600 }}>
                  {salaryReports.filter(r => r.status === 'Approved').length}/{salaryReports.length}
                </div>
              </div>
            </div>
          </div>

          {/* Auto-calculation Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-700" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Automatic Calculation Enabled
                </p>
                <p className="text-blue-600" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                  Salary reports are automatically calculated based on attendance, working days, and contract terms. 
                  Reports are generated on the designated approval date each month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
