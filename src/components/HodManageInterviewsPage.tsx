import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Mail, Phone, FileText, Edit, Plus, ArrowLeft, Check, X, Loader2, Upload, Play } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';
import { getInterviews, getInterviewCandidates, createInterview, updateInterviewDate, getActiveInterviewSession, InterviewData, CandidateData, ActiveInterviewSession } from '../services/api';
import InterviewMarkingPage from './InterviewMarkingPage';

interface HodManageInterviewsPageProps {
  onBack: () => void;
}

export default function HodManageInterviewsPage({ onBack }: HodManageInterviewsPageProps) {
  // ── Schedule Form ──────────────────────────────────
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // ── Interviews list ────────────────────────────────
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  // ── Candidates per interview ───────────────────────
  const [candidatesMap, setCandidatesMap] = useState<Record<string, CandidateData[]>>({});
  const [loadingCandidatesFor, setLoadingCandidatesFor] = useState<string | null>(null);

  // ── Edit date state ────────────────────────────────
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [savingDate, setSavingDate] = useState(false);

  // ── Live session state (polling localStorage) ──────
  const [liveSession, setLiveSession] = useState<ActiveInterviewSession | null>(null);
  const [markingInterview, setMarkingInterview] = useState<InterviewData | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // ── Load interviews on mount ───────────────────────
  useEffect(() => {
    fetchInterviews();
  }, []);

  // ── Poll localStorage for live session every 5s ───
  useEffect(() => {
    const check = () => setLiveSession(getActiveInterviewSession());
    check(); // immediate
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchInterviews() {
    setLoadingInterviews(true);
    try {
      const data = await getInterviews();
      setInterviews(data);
      // Auto-load candidates for all upcoming interviews
      data.filter(i => i.status === 'upcoming').forEach(i => loadCandidates(i.id));
    } catch (e) {
      console.error('Failed to load interviews', e);
    } finally {
      setLoadingInterviews(false);
    }
  }

  async function loadCandidates(interviewId: string) {
    if (candidatesMap[interviewId]) return; // already loaded
    setLoadingCandidatesFor(interviewId);
    try {
      const candidates = await getInterviewCandidates(interviewId);
      setCandidatesMap(prev => ({ ...prev, [interviewId]: candidates }));
    } catch (e) {
      console.error('Failed to load candidates for', interviewId, e);
    } finally {
      setLoadingCandidatesFor(null);
    }
  }

  // ── Create interview ───────────────────────────────
  async function handleScheduleInterview() {
    setSubmitError('');
    setSubmitSuccess('');

    if (!formName.trim()) { setSubmitError('Please enter an interview name.'); return; }
    if (!formDate) { setSubmitError('Please select an interview date.'); return; }
    if (!formFile) { setSubmitError('Please upload a candidates Excel file (.xlsx).'); return; }

    setIsSubmitting(true);
    try {
      const dateStr = `${formDate.getFullYear()}-${String(formDate.getMonth() + 1).padStart(2, '0')}-${String(formDate.getDate()).padStart(2, '0')}`;
      await createInterview(formName.trim(), dateStr, formFile);
      setSubmitSuccess(`Interview "${formName}" scheduled successfully! Candidates imported.`);
      setFormName('');
      setFormDate(undefined);
      setFormFile(null);
      // Reset the file input
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      // Refresh interviews (clear candidates cache to re-fetch)
      setCandidatesMap({});
      fetchInterviews();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to schedule interview. Check the Excel format.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Update date ────────────────────────────────────
  async function handleSaveDate(interviewId: string) {
    if (!editDate) { alert('Please select a date.'); return; }
    setSavingDate(true);
    try {
      const dateStr = `${editDate.getFullYear()}-${String(editDate.getMonth() + 1).padStart(2, '0')}-${String(editDate.getDate()).padStart(2, '0')}`;
      const updated = await updateInterviewDate(interviewId, dateStr);
      setInterviews(prev => prev.map(i => i.id === interviewId ? { ...i, date: updated.date } : i));
      setEditingInterviewId(null);
      setEditDate(undefined);
    } catch (e: any) {
      alert(e.message || 'Failed to update date.');
    } finally {
      setSavingDate(false);
    }
  }

  function daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatForPicker(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  const upcomingInterviews = interviews.filter(i => i.status === 'upcoming');
  const endedInterviews = interviews.filter(i => i.status === 'ended');

  // Navigate to marking page when joining
  if (markingInterview) {
    const candidates = candidatesMap[markingInterview.id] || [];
    return (
      <InterviewMarkingPage
        interview={{ id: markingInterview.id, interviewNumber: markingInterview.interviewNumber, date: markingInterview.date }}
        candidates={candidates.map(c => ({ id: c.candidateId || c.id, name: c.name, email: c.email, phone: c.phone, cvUrl: c.cvUrl }))}
        onBack={() => setMarkingInterview(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" className="text-white hover:bg-[#3c9a93] p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>
            Manage Interviews
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 px-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-6 mt-6">

          {/* ── Schedule New Interview ── */}
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
            <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '20px' }}>
              Schedule New Interview
            </h3>
            <Separator className="mb-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Interview Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g., Interview #4"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                  />
                </div>
                <div>
                  <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Interview Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]",
                          !formDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formDate ? formatForPicker(formDate) : <span>DD/MM/YY</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={setFormDate}
                        disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Upload Candidates List (.xlsx)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={e => setFormFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                  />
                  <Button
                    onClick={handleScheduleInterview}
                    disabled={isSubmitting}
                    className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Schedule Interview</>
                    )}
                  </Button>
                </div>
                <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                  Required columns: <strong>Candidate ID | Name | Email | Phone | CV</strong>
                </p>

                {formFile && (
                  <div className="mt-2 p-2 bg-[#e6f7f6] border border-[#4db4ac] rounded-lg inline-flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#4db4ac]" />
                    <p className="text-[#4db4ac]" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {formFile.name}
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <X className="h-4 w-4" />{submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-2">
                    <Check className="h-4 w-4" />{submitSuccess}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Loading state ── */}
          {loadingInterviews && (
            <div className="flex items-center justify-center py-12 gap-3 text-[#4db4ac]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p style={{ fontSize: '14px' }}>Loading interviews...</p>
            </div>
          )}

          {/* ── Upcoming Interviews ── */}
          {!loadingInterviews && upcomingInterviews.length === 0 && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-[#d0d0d0] mx-auto mb-3" />
              <p className="text-[#999999]" style={{ fontSize: '14px' }}>No upcoming interviews. Schedule one above.</p>
            </Card>
          )}

          {upcomingInterviews.map(interview => {
            const days = daysUntil(interview.date);
            const candidates = candidatesMap[interview.id] || [];
            const isLoadingCands = loadingCandidatesFor === interview.id;

            return (
              <Card key={interview.id} className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-[#4db4ac]" />
                    <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                      {interview.interviewNumber} — Upcoming Interview
                    </h3>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                      UPCOMING
                    </Badge>
                  </div>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  {/* Date Card */}
                  <Card className="border-2 border-[#4db4ac] rounded-lg p-4 bg-[#e6f7f6]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-5 w-5 text-[#4db4ac]" />
                          <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                            Interview Date
                          </Label>
                        </div>

                        {editingInterviewId === interview.id ? (
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-48 justify-start text-left font-normal bg-white border-[#4db4ac] rounded-lg",
                                    !editDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editDate ? formatForPicker(editDate) : <span>DD/MM/YY</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editDate}
                                  onSelect={setEditDate}
                                  disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Button
                              size="sm"
                              onClick={() => handleSaveDate(interview.id)}
                              disabled={savingDate}
                              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                            >
                              {savingDate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingInterviewId(null); setEditDate(undefined); }}
                              className="border-red-300 text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>
                              {formatDate(interview.date)}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingInterviewId(interview.id); setEditDate(new Date(interview.date)); }}
                              className="border-[#4db4ac] text-[#4db4ac] hover:bg-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Date
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Join Interview button — appears when Coordinator starts a live session */}
                      {liveSession && liveSession.id === interview.id && (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white animate-pulse"
                          onClick={() => {
                            loadCandidates(interview.id);
                            setMarkingInterview(interview);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Join Interview
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>Total Candidates</p>
                      <p className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                        {interview.candidateCount}
                      </p>
                    </Card>
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>Interview Status</p>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                        UPCOMING
                      </Badge>
                    </Card>
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>Days Until Interview</p>
                      <p className={`${days < 7 ? 'text-red-500' : 'text-[#4db4ac]'}`} style={{ fontSize: '24px', fontWeight: 700 }}>
                        {days > 0 ? days : 0}
                      </p>
                    </Card>
                  </div>

                  {/* Candidates Table */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-[#4db4ac]" />
                      <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                        Candidates for This Interview
                      </h4>
                      <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                        {candidates.length}
                      </Badge>
                    </div>

                    {isLoadingCands ? (
                      <div className="flex items-center gap-2 py-6 justify-center text-[#4db4ac]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span style={{ fontSize: '13px' }}>Loading candidates...</span>
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="text-center py-8 border border-[#e0e0e0] rounded-lg">
                        <Users className="h-8 w-8 text-[#d0d0d0] mx-auto mb-2" />
                        <p className="text-[#999999]" style={{ fontSize: '13px' }}>
                          No candidates uploaded yet
                        </p>
                      </div>
                    ) : (
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
                              <TableRow key={candidate.id} className="hover:bg-[#f9f9f9]">
                                <TableCell className="text-[#555555] py-2" style={{ fontSize: '13px' }}>
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 500 }}>
                                  {candidate.candidateId || '—'}
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
                                  {candidate.cvUrl ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                                      onClick={() => window.open(candidate.cvUrl, '_blank')}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      View CV
                                    </Button>
                                  ) : (
                                    <span className="text-[#aaaaaa]" style={{ fontSize: '12px' }}>—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* ── Ended Interviews (collapsed summary) ── */}
          {endedInterviews.length > 0 && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
                Ended Interviews ({endedInterviews.length})
              </h3>
              <Separator className="mb-4" />
              <div className="space-y-2">
                {endedInterviews.map(interview => (
                  <div key={interview.id} className="flex items-center justify-between p-3 border border-[#e0e0e0] rounded-lg bg-[#f9f9f9]">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-[#999999]" />
                      <div>
                        <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>{interview.interviewNumber}</p>
                        <p className="text-[#999999]" style={{ fontSize: '12px' }}>{formatDate(interview.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gray-100 text-gray-600 border-gray-300 border" style={{ fontSize: '11px' }}>
                        ENDED
                      </Badge>
                      <span className="text-[#555555]" style={{ fontSize: '12px' }}>
                        {interview.candidateCount} candidates
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e0e0e0] py-3">
        <div className="text-center">
          <p className="text-[#555555]" style={{ fontSize: '13px' }}>
            University of Kelaniya | Temporary Staff Coordination System
          </p>
        </div>
      </footer>
    </div>
  );
}
