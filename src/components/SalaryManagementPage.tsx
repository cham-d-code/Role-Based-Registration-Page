import { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, Loader2, Save, Send, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import {
  approveSalaryReport,
  downloadSalaryReportsExcel,
  generateSalaryReports,
  getSalaryReports,
  getSalaryTemplate,
  rejectSalaryReport,
  sendSalaryReportsToHod,
  type SalaryReportDto,
  type SalaryTemplateDto,
  upsertSalaryTemplate,
} from '../services/api';

interface SalaryManagementPageProps {
  userRole: 'coordinator' | 'hod';
}

function getCurrentPeriodKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatDate(input?: string | null) {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString();
}

function formatDateTime(input?: string | null) {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

function formatMoney(value?: number | null) {
  return `LKR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalaryManagementPage({ userRole }: SalaryManagementPageProps) {
  const [periodKey, setPeriodKey] = useState(getCurrentPeriodKey());
  const [template, setTemplate] = useState<SalaryTemplateDto | null>(null);
  const [reports, setReports] = useState<SalaryReportDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    dayRate: '',
    extraLeaveDayDeduction: '',
    totalWorkableDays: '',
  });

  const loadData = async (selectedPeriod = periodKey) => {
    setLoading(true);
    try {
      const [tpl, reps] = await Promise.all([
        getSalaryTemplate(selectedPeriod).catch(() => null),
        getSalaryReports(selectedPeriod).catch(() => []),
      ]);
      setTemplate(tpl);
      setReports(reps);
      setTemplateForm({
        dayRate: tpl?.dayRate != null ? String(tpl.dayRate) : '',
        extraLeaveDayDeduction: tpl?.extraLeaveDayDeduction != null ? String(tpl.extraLeaveDayDeduction) : '',
        totalWorkableDays: tpl?.totalWorkableDays != null ? String(tpl.totalWorkableDays) : '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(periodKey);
  }, [periodKey]);

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.staff += 1;
        acc.gross += Number(report.grossSalary || 0);
        acc.deductions += Number(report.deductionAmount || 0);
        acc.net += Number(report.netSalary || 0);
        return acc;
      },
      { staff: 0, gross: 0, deductions: 0, net: 0 }
    );
  }, [reports]);

  const handleSaveTemplate = async () => {
    try {
      setSavingTemplate(true);
      const saved = await upsertSalaryTemplate({
        periodKey,
        dayRate: Number(templateForm.dayRate || 0),
        extraLeaveDayDeduction: Number(templateForm.extraLeaveDayDeduction || 0),
        totalWorkableDays: Number(templateForm.totalWorkableDays || 0),
      });
      setTemplate(saved);
      alert('Salary template saved successfully.');
    } catch (e: any) {
      alert(e?.message || 'Failed to save salary template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleGenerateReports = async () => {
    try {
      setGenerating(true);
      const next = await generateSalaryReports(periodKey);
      setReports(next);
      alert('Salary reports generated successfully.');
    } catch (e: any) {
      alert(e?.message || 'Failed to generate salary reports');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToHod = async () => {
    try {
      setSending(true);
      await sendSalaryReportsToHod(periodKey);
      await loadData(periodKey);
      alert('Salary reports sent to HOD for review.');
    } catch (e: any) {
      alert(e?.message || 'Failed to send salary reports');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      await downloadSalaryReportsExcel(periodKey);
    } catch (e: any) {
      alert(e?.message || 'Failed to download salary report');
    } finally {
      setDownloading(false);
    }
  };

  const handleReview = async (reportId: string, action: 'approve' | 'reject') => {
    const note = window.prompt(action === 'approve' ? 'Approval note (optional)' : 'Rejection note');
    try {
      const updated = action === 'approve'
        ? await approveSalaryReport(reportId, note || '')
        : await rejectSalaryReport(reportId, note || '');
      setReports((prev) => prev.map((report) => (report.id === reportId ? updated : report)));
      alert(action === 'approve' ? 'Salary report approved.' : 'Salary report rejected.');
    } catch (e: any) {
      alert(e?.message || `Failed to ${action} salary report`);
    }
  };

  const getStatusBadge = (status: SalaryReportDto['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-300 border">APPROVED</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300 border">REJECTED</Badge>;
      case 'sent_to_hod':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300 border">SENT TO HOD</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300 border">DRAFT</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            {userRole === 'coordinator' ? 'Salary Template & Reports' : 'Salary Reports Review'}
          </h2>
          <p className="text-[#555555]" style={{ fontSize: '14px' }}>
            Salary period is calculated from the 10th of the selected month to the 10th of the next month. First 2 leave days are free.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-[180px]">
            <Label className="mb-2 block">Month</Label>
            <Input type="month" value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => loadData(periodKey)} className="mt-6">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {userRole === 'coordinator' && (
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-[#4db4ac]" />
            <h3 className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
              Salary Template
            </h3>
          </div>
          <Separator className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">1 Day Rate</Label>
              <Input
                type="number"
                min="0"
                value={templateForm.dayRate}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, dayRate: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block">Extra Leave Day Reduction Rate</Label>
              <Input
                type="number"
                min="0"
                value={templateForm.extraLeaveDayDeduction}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, extraLeaveDayDeduction: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block">Total Workable Days For Month</Label>
              <Input
                type="number"
                min="0"
                value={templateForm.totalWorkableDays}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, totalWorkableDays: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white">
              {savingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Template
            </Button>
            <Button variant="outline" onClick={handleGenerateReports} disabled={generating || !template} className="border-[#4db4ac] text-[#4db4ac]">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
              Apply Template / Generate Reports
            </Button>
            <Button onClick={handleSendToHod} disabled={sending || reports.length === 0} className="bg-[#1f6feb] hover:bg-[#1a5dc9] text-white">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Report To HOD
            </Button>
          </div>

          {template && (
            <p className="text-[#777777] mt-3" style={{ fontSize: '12px' }}>
              Pay period: {formatDate(template.periodStart)} to {formatDate(template.periodEnd)}
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] p-5">
          <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>Total Staff</p>
          <p className="text-[#222222]" style={{ fontSize: '28px', fontWeight: 700 }}>{totals.staff}</p>
        </Card>
        <Card className="bg-white border-0 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] p-5">
          <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>Gross Salary</p>
          <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>{formatMoney(totals.gross)}</p>
        </Card>
        <Card className="bg-white border-0 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] p-5">
          <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>Total Deductions</p>
          <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>{formatMoney(totals.deductions)}</p>
        </Card>
        <Card className="bg-white border-0 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] p-5">
          <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 500 }}>Net Salary</p>
          <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>{formatMoney(totals.net)}</p>
        </Card>
      </div>

      <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
              Monthly Salary Summary
            </h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-[#4db4ac]" />}
          </div>
          <Button
            onClick={handleDownloadExcel}
            disabled={downloading || reports.length === 0}
            variant="outline"
            className="border-2 border-[#15803d] bg-[#f0fdf4] !text-black font-semibold hover:bg-[#dcfce7] hover:!text-black [&_svg]:!text-black disabled:!text-neutral-600 disabled:border-neutral-400 disabled:bg-neutral-100 shrink-0"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download salary (Excel)
          </Button>
        </div>
        <Separator className="mb-4" />

        {reports.length === 0 ? (
          <p className="text-[#777777]" style={{ fontSize: '14px' }}>
            No salary reports found for this month yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Leave</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Extra Leave</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deduction</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#222222]">{report.staffName || 'Temporary Staff'}</div>
                        <div className="text-[#777777]" style={{ fontSize: '12px' }}>{report.staffEmail || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{report.presentDays}</TableCell>
                    <TableCell className="text-center">{report.leaveDays}</TableCell>
                    <TableCell className="text-center">{report.absentDays}</TableCell>
                    <TableCell className="text-center">{report.extraLeaveDays}</TableCell>
                    <TableCell className="text-right">{formatMoney(report.grossSalary)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatMoney(report.deductionAmount)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatMoney(report.netSalary)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      {userRole === 'hod' && report.status === 'sent_to_hod' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => handleReview(report.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReview(report.id, 'reject')} className="border-red-300 text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="text-[#777777]" style={{ fontSize: '12px' }}>
                          {report.reviewedAt ? `Reviewed: ${formatDateTime(report.reviewedAt)}` : report.sentToHodAt ? `Sent: ${formatDateTime(report.sentToHodAt)}` : '-'}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

