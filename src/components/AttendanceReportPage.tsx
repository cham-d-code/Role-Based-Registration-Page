import { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Eye, Save, RefreshCw, Download, Loader2 } from 'lucide-react';
import StaffAttendanceDialog from './StaffAttendanceDialog';
import { downloadAttendanceReportExcel } from '../services/api';
import {
  computeWorkingDays,
  getPeriodLabel,
  getPeriodRange,
  SRI_LANKA_TZ,
} from './attendanceUtils';

interface StaffLite {
  id: string;
  name: string;
  email: string;
  contractStartDate?: string;
  contractEndDate?: string;
  preferredSubjects?: string[];
}

interface AttendanceReportPageProps {
  staffMembers: StaffLite[];
  userRole?: 'coordinator' | 'hod';
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function buildMockStats(staffId: string, totalDays: number) {
  const seed = seedFromString(staffId || 'x');
  const absent = Math.min(totalDays, seed % 3);
  const present = Math.max(0, totalDays - absent);
  const rate = totalDays > 0 ? (present / totalDays) * 100 : 0;
  return { totalDays, present, absent, rate };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getSriLankaNow(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SRI_LANKA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value) - 1;
  const d = Number(parts.find(p => p.type === 'day')?.value);
  return new Date(y, m, d);
}

export default function AttendanceReportPage({
  staffMembers,
  userRole = 'coordinator',
}: AttendanceReportPageProps) {
  const now = useMemo(() => getSriLankaNow(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState<StaffLite | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      await downloadAttendanceReportExcel(periodKey);
    } catch (e: any) {
      alert(e?.message || 'Failed to download attendance report');
    } finally {
      setDownloading(false);
    }
  };

  const period = useMemo(
    () => getPeriodRange(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const systemTotalDays = useMemo(
    () => computeWorkingDays(period.start, period.end),
    [period],
  );

  // Editable override per period
  const storageKey = `attendanceWorkingDays:${selectedYear}-${selectedMonth}`;
  const [workingDays, setWorkingDays] = useState<number>(systemTotalDays);
  const [workingDaysInput, setWorkingDaysInput] = useState<string>(String(systemTotalDays));

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const initial = saved ? Number(saved) : systemTotalDays;
    const v = Number.isFinite(initial) && initial >= 0 ? initial : systemTotalDays;
    setWorkingDays(v);
    setWorkingDaysInput(String(v));
  }, [storageKey, systemTotalDays]);

  const handleSaveWorkingDays = () => {
    const n = Number(workingDaysInput);
    if (!Number.isFinite(n) || n < 0) return;
    const rounded = Math.round(n);
    setWorkingDays(rounded);
    try {
      localStorage.setItem(storageKey, String(rounded));
    } catch {
      // ignore
    }
  };

  const handleResetWorkingDays = () => {
    setWorkingDays(systemTotalDays);
    setWorkingDaysInput(String(systemTotalDays));
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staffMembers;
    return staffMembers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.preferredSubjects || []).join(' ').toLowerCase().includes(q),
    );
  }, [search, staffMembers]);

  const yearOptions = useMemo(() => {
    const ys: number[] = [];
    for (let y = currentYear; y <= currentYear + 3; y++) ys.push(y);
    return ys;
  }, [currentYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            Attendance Report
          </h2>
          <p className="text-[#777777]" style={{ fontSize: '13px' }}>
            Monitor attendance summaries of all temporary staff. Period: {getPeriodLabel(period)}
          </p>
        </div>
        <Button
          onClick={handleDownloadExcel}
          disabled={downloading}
          className="bg-[#16a34a] hover:bg-[#15803d] text-white self-start md:self-auto"
          style={{ minWidth: '180px' }}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download attendance (Excel)
        </Button>
      </div>

      {/* Period + Working Days Controls */}
      <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.08)] border-0 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[#555555] mb-1 block" style={{ fontSize: '12px', fontWeight: 600 }}>
              Month
            </label>
            <Select
              value={String(selectedMonth)}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, idx) => (
                  <SelectItem key={m} value={String(idx)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[#555555] mb-1 block" style={{ fontSize: '12px', fontWeight: 600 }}>
              Year
            </label>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[#555555] mb-1 block" style={{ fontSize: '12px', fontWeight: 600 }}>
              Total Working Days
              <span className="text-[#999999] ml-2" style={{ fontWeight: 400 }}>
                (System calculated: {systemTotalDays}, excluding weekends &amp; Sri Lankan holidays)
              </span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={workingDaysInput}
                onChange={(e) => setWorkingDaysInput(e.target.value)}
                className="max-w-[140px]"
              />
              <Button
                onClick={handleSaveWorkingDays}
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                onClick={handleResetWorkingDays}
                variant="outline"
                className="border-[#999999] text-[#555555]"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.08)] border-0 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999999]" />
            <Input
              placeholder="Search staff by name, email, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Separator className="mb-3" />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead className="text-center">Total Working Days</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="text-center py-8 text-[#999999]" style={{ fontSize: '14px' }}>
                      No staff members found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((staff) => {
                const st = buildMockStats(staff.id, workingDays);
                const rateColor =
                  st.rate >= 90
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : st.rate >= 75
                      ? 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'bg-red-100 text-red-700 border-red-300';
                return (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {staff.name}
                        </p>
                        <p className="text-[#777777]" style={{ fontSize: '12px' }}>
                          {staff.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{st.totalDays}</TableCell>
                    <TableCell className="text-center text-green-700">{st.present}</TableCell>
                    <TableCell className="text-center text-red-700">{st.absent}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${rateColor} border`} style={{ fontSize: '11px' }}>
                        {st.rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                        onClick={() => {
                          setSelected(staff);
                          setShowDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selected && (
        <StaffAttendanceDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          staffName={selected.name}
          staffId={selected.id}
          periodStart={period.start}
          periodEnd={period.end}
          periodLabel={getPeriodLabel(period)}
        />
      )}

      {userRole === 'hod' && (
        <p className="text-[#999999] text-center" style={{ fontSize: '12px' }}>
          Read-only view for Head of Department.
        </p>
      )}
    </div>
  );
}
