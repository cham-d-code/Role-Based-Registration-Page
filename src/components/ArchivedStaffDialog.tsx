import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Archive, Download, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ArchivedStaff {
  staffId: string;
  name: string;
  email: string;
  contractStart: string;
  contractEnd: string;
  totalWorkingDays: number;
  totalSalaryPaid: number;
}

interface ArchivedStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ArchivedStaffDialog({ 
  open, 
  onOpenChange 
}: ArchivedStaffDialogProps) {
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  // FR22: Mock archived staff data
  const archivedStaff: ArchivedStaff[] = [
    {
      staffId: 'TS004',
      name: 'D.A. Jayawardena',
      email: 'd.jayawardena@kln.ac.lk',
      contractStart: 'Jan 1, 2025',
      contractEnd: 'Sep 30, 2025',
      totalWorkingDays: 195,
      totalSalaryPaid: 420000
    },
    {
      staffId: 'TS005',
      name: 'M.K. Wickramasinghe',
      email: 'm.wickramasinghe@kln.ac.lk',
      contractStart: 'Mar 1, 2025',
      contractEnd: 'Aug 31, 2025',
      totalWorkingDays: 132,
      totalSalaryPaid: 285000
    }
  ];

  const handleDownloadAttendance = (staffName: string) => {
    toast.success(`Attendance summary for ${staffName} downloaded`);
  };

  const handleDownloadSalary = (staffName: string) => {
    toast.success(`Salary reports for ${staffName} downloaded`);
  };

  const handleDownloadAllRecords = (staffName: string) => {
    toast.success(`All records for ${staffName} downloaded`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-[#4db4ac]" />
                Archived Staff Records
              </DialogTitle>
              <DialogDescription>
                View and download attendance and salary reports for staff with ended contracts
              </DialogDescription>
            </div>
            <Badge className="bg-[#4db4ac] text-white">FR22</Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Staff List</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-3 mt-4">
            {archivedStaff.map((staff) => (
              <div 
                key={staff.staffId}
                className="border border-[#e0e0e0] rounded-lg p-4 hover:border-[#4db4ac] transition-colors cursor-pointer"
                onClick={() => setSelectedStaff(staff.staffId)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[#333333]" style={{ fontSize: '15px', fontWeight: 600 }}>
                        {staff.name}
                      </h3>
                      <Badge variant="outline" className="text-[#999999] border-[#cccccc]">
                        {staff.staffId}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 text-[#666666]" style={{ fontSize: '12px' }}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Contract: {staff.contractStart} - {staff.contractEnd}</span>
                      </div>
                      <div className="text-[#666666]" style={{ fontSize: '12px' }}>
                        <span className="text-[#999999]">Email:</span> {staff.email}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <div className="text-blue-600" style={{ fontSize: '10px', fontWeight: 500 }}>
                          Total Working Days
                        </div>
                        <div className="text-blue-700 mt-0.5" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {staff.totalWorkingDays}
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="text-green-600" style={{ fontSize: '10px', fontWeight: 500 }}>
                          Total Salary Paid
                        </div>
                        <div className="text-green-700 mt-0.5" style={{ fontSize: '16px', fontWeight: 600 }}>
                          Rs. {staff.totalSalaryPaid.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAttendance(staff.name);
                      }}
                      className="border-[#cccccc] hover:border-[#4db4ac] hover:bg-[#e6f7f6] rounded-lg whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Attendance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSalary(staff.name);
                      }}
                      className="border-[#cccccc] hover:border-[#4db4ac] hover:bg-[#e6f7f6] rounded-lg whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Salary
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAllRecords(staff.name);
                      }}
                      className="bg-[#4db4ac] hover:bg-[#3da39b] text-white rounded-lg whitespace-nowrap"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      All Records
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {archivedStaff.length === 0 && (
              <div className="text-center py-12 text-[#999999]">
                <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p style={{ fontSize: '14px' }}>No archived staff records available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <div className="space-y-4">
              <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4">
                <h3 className="text-[#333333] mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Available Report Types
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#e0e0e0] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#4db4ac]" />
                      <div>
                        <div className="text-[#333333]" style={{ fontSize: '13px', fontWeight: 500 }}>
                          Attendance Summary
                        </div>
                        <div className="text-[#999999]" style={{ fontSize: '11px' }}>
                          Weekly task lists and availability records
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-[#e6f7f6] text-[#4db4ac]">FR20</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#e0e0e0] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[#4db4ac]" />
                      <div>
                        <div className="text-[#333333]" style={{ fontSize: '13px', fontWeight: 500 }}>
                          Salary Reports
                        </div>
                        <div className="text-[#999999]" style={{ fontSize: '11px' }}>
                          Monthly salary calculations and payment records
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-[#e6f7f6] text-[#4db4ac]">FR21</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-700" style={{ fontSize: '12px', fontWeight: 500 }}>
                      Document Retention Policy
                    </p>
                    <p className="text-blue-600" style={{ fontSize: '11px', lineHeight: '1.5', marginTop: '4px' }}>
                      All attendance summaries and salary reports for staff with ended contracts are securely stored 
                      and available for download. Records are maintained for compliance and auditing purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
