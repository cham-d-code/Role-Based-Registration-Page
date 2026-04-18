import { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon, Users, Mail, Phone, FileText, Edit, Plus, ArrowLeft,
  Check, X, Loader2, Upload, UserCheck, Wifi
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  getInterviews, getInterviewCandidates, createInterview, updateInterviewDate,
  getActiveSession, getMarkingScheme,
  InterviewData, CandidateData, SessionState, MarkingSchemeData,
} from '../services/api';
import InterviewMarkingPage from './InterviewMarkingPage';

interface HodManageInterviewsPageProps {
  onBack: () => void;
}

export default function HodManageInterviewsPage({ onBack }: HodManageInterviewsPageProps) {
  // ── Schedule Form ─────────────────────────────────────────────────────────
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // ── Interview list ────────────────────────────────────────────────────────
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  // ── Candidates per interview ──────────────────────────────────────────────
  const [candidatesMap, setCandidatesMap] = useState<Record<string, CandidateData[]>>({});
  const [loadingCandidatesFor, setLoadingCandidatesFor] = useState<string | null>(null);

  // ── Edit date state ───────────────────────────────────────────────────────
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [savingDate, setSavingDate] = useState(false);

  // ── Live Session State ────────────────────────────────────────────────────
  const [liveInterviewId, setLiveInterviewId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  // ── Navigation ────────────────────────────────────────────────────────────
  const [markingInterview, setMarkingInterview] = useState<InterviewData | null>(null);
  const [markingSchemeForPage, setMarkingSchemeForPage] = useState<MarkingSchemeData | undefined>(undefined);

  const _today = new Date();
  const todayStr = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, '0')}-${String(_today.getDate()).padStart(2, '0')}`;

  const candidatesMapRef = useRef(candidatesMap);
  candidatesMapRef.current = candidatesMap;

  useEffect(() => { fetchInterviews(); }, []);

  // Discover live session (coordinator starts); HOD joins from waiting room after admission.
  useEffect(() => {
    const poll = async () => {
      try {
        const active = await getActiveSession();
        if (!active) {
          setLiveInterviewId(null);
          setSessionState(null);
          return;
        }
        setLiveInterviewId(active.interviewId);
        setSessionState(active);
        loadCandidates(active.interviewId);
      } catch {
        setLiveInterviewId(null);
        setSessionState(null);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchInterviews() {
    setLoadingInterviews(true);
    try {
      const data = await getInterviews();
      setInterviews(data);
      data.filter(i => i.status === 'upcoming').forEach(i => loadCandidates(i.id));
    } catch (e) {
      console.error('Failed to load interviews', e);
    } finally {
      setLoadingInterviews(false);
    }
  }

  async function loadCandidates(interviewId: string) {
    if (candidatesMapRef.current[interviewId]) return;
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

  async function handleScheduleInterview() {
    setSubmitError(''); setSubmitSuccess('');
    if (!formName.trim()) { setSubmitError('Please enter an interview name.'); return; }
    if (!formDate) { setSubmitError('Please select an interview date.'); return; }
    if (!formFile) { setSubmitError('Please upload a candidates Excel file (.xlsx).'); return; }

    setIsSubmitting(true);
    try {
      const dateStr = `${formDate.getFullYear()}-${String(formDate.getMonth() + 1).padStart(2, '0')}-${String(formDate.getDate()).padStart(2, '0')}`;
      await createInterview(formName.trim(), dateStr, formFile);
      setSubmitSuccess(`Interview "${formName}" scheduled successfully!`);
      setFormName(''); setFormDate(undefined); setFormFile(null);
      const fileInput = document.getElementById('excel-upload-hod') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setCandidatesMap({});
      fetchInterviews();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to schedule interview. Check the Excel format.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDate(interviewId: string) {
    if (!editDate) { alert('Please select a date.'); return; }
    setSavingDate(true);
    try {
      const dateStr = `${editDate.getFullYear()}-${String(editDate.getMonth() + 1).padStart(2, '0')}-${String(editDate.getDate()).padStart(2, '0')}`;
      const updated = await updateInterviewDate(interviewId, dateStr);
      setInterviews(prev => prev.map(i => i.id === interviewId ? { ...i, date: updated.date } : i));
      setEditingInterviewId(null); setEditDate(undefined);
    } catch (e: any) {
      alert(e.message || 'Failed to update date.');
    } finally {
      setSavingDate(false);
    }
  }

  async function handleOpenMarking(interview: InterviewData) {
    await loadCandidates(interview.id);
    const scheme = await getMarkingScheme(interview.id).catch(() => null);
    if (!scheme) {
      alert('The coordinator has not created a marking scheme for this interview yet.');
      return;
    }
    setMarkingSchemeForPage(scheme);
    setMarkingInterview(interview);
  }

  function daysUntil(dateStr: string): number {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  }

  const upcomingInterviews = interviews.filter(i => i.status === 'upcoming');
  const endedInterviews = interviews.filter(i => i.status === 'ended');

  if (markingInterview) {
    const candidates = candidatesMap[markingInterview.id] || [];
    return (
      <InterviewMarkingPage
        interview={{ id: markingInterview.id, interviewNumber: markingInterview.interviewNumber, date: markingInterview.date }}
        candidates={candidates.map(c => ({
          id: c.id,
          displayId: c.candidateId,
          name: c.name,
          email: c.email,
          phone: c.phone,
          cvUrl: c.cvUrl,
        }))}
        existingScheme={markingSchemeForPage}
        onBack={() => {
          setMarkingInterview(null);
          setMarkingSchemeForPage(undefined);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" className="text-white hover:bg-[#3c9a93] p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>Manage Interviews</h1>
        </div>
        {liveInterviewId && (
          <div className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg">
            <Wifi className="h-4 w-4 text-white animate-pulse" />
            <span className="text-white text-sm font-semibold">Interview Live</span>
          </div>
        )}
      </header>

      <main className="pt-16 px-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-6 mt-6">

          {/* ── Schedule New Interview ── */}
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
            <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '20px' }}>Schedule New Interview</h3>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>Interview Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Interview #4"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                  />
                </div>
                <div>
                  <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>Interview Date</Label>
                  <Input
                    type="date"
                    min={todayStr}
                    value={formDate ? `${formDate.getFullYear()}-${String(formDate.getMonth() + 1).padStart(2, '0')}-${String(formDate.getDate()).padStart(2, '0')}` : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val) { const [y, m, d] = val.split('-').map(Number); setFormDate(new Date(y, m - 1, d)); }
                      else setFormDate(undefined);
                    }}
                    className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>Upload Candidates List (.xlsx)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="excel-upload-hod"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={e => setFormFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border-[#d0d0d0] rounded-lg"
                  />
                  <Button onClick={handleScheduleInterview} disabled={isSubmitting} className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white whitespace-nowrap">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Plus className="h-4 w-4 mr-2" />Schedule Interview</>}
                  </Button>
                </div>
                <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                  Required columns: <strong>Candidate ID | Name | Email | Phone | CV</strong>
                </p>
                {formFile && (
                  <div className="mt-2 p-2 bg-[#e6f7f6] border border-[#4db4ac] rounded-lg inline-flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#4db4ac]" />
                    <p className="text-[#4db4ac]" style={{ fontSize: '12px', fontWeight: 600 }}>{formFile.name}</p>
                  </div>
                )}
                {submitError && <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2"><X className="h-4 w-4" />{submitError}</div>}
                {submitSuccess && <div className="mt-2 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-2"><Check className="h-4 w-4" />{submitSuccess}</div>}
              </div>
            </div>
          </Card>

          {loadingInterviews && (
            <div className="flex items-center justify-center py-12 gap-3 text-[#4db4ac]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p style={{ fontSize: '14px' }}>Loading interviews...</p>
            </div>
          )}

          {!loadingInterviews && upcomingInterviews.length === 0 && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-[#d0d0d0] mx-auto mb-3" />
              <p className="text-[#999999]" style={{ fontSize: '14px' }}>No upcoming interviews. Schedule one above.</p>
            </Card>
          )}

          {/* ── Upcoming Interviews ── */}
          {upcomingInterviews.map(interview => {
            const days = daysUntil(interview.date);
            const candidates = candidatesMap[interview.id] || [];
            const isLoadingCands = loadingCandidatesFor === interview.id;
            const isLive = liveInterviewId === interview.id;

            return (
              <Card key={interview.id} className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-[#4db4ac]" />
                    <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                      {interview.interviewNumber} — Upcoming Interview
                    </h3>
                    {isLive
                      ? <Badge className="bg-green-100 text-green-700 border-green-300 border animate-pulse" style={{ fontSize: '12px' }}>LIVE</Badge>
                      : <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>UPCOMING</Badge>
                    }
                  </div>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  {/* Date + Start/End */}
                  <Card className="border-2 border-[#4db4ac] rounded-lg p-4 bg-[#e6f7f6]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-5 w-5 text-[#4db4ac]" />
                          <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>Interview Date</Label>
                        </div>

                        {editingInterviewId === interview.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              min={todayStr}
                              value={editDate ? `${editDate.getFullYear()}-${String(editDate.getMonth() + 1).padStart(2, '0')}-${String(editDate.getDate()).padStart(2, '0')}` : ''}
                              onChange={e => {
                                const val = e.target.value;
                                if (val) { const [y, m, d] = val.split('-').map(Number); setEditDate(new Date(y, m - 1, d)); }
                                else setEditDate(undefined);
                              }}
                              className="w-48 bg-white border-[#4db4ac] rounded-lg"
                            />
                            <Button size="sm" onClick={() => handleSaveDate(interview.id)} disabled={savingDate} className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white">
                              {savingDate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditingInterviewId(null); setEditDate(undefined); }} className="border-red-300 text-red-500">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>{formatDate(interview.date)}</p>
                            {!isLive && (
                              <Button variant="outline" size="sm" onClick={() => { setEditingInterviewId(interview.id); setEditDate(new Date(interview.date)); }} className="border-[#4db4ac] text-[#4db4ac] hover:bg-white">
                                <Edit className="h-4 w-4 mr-1" />Edit Date
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 max-w-md text-right">
                        {!isLive && (
                          <p className="text-[#555555]" style={{ fontSize: '12px' }}>
                            Only the Temporary Staff Coordinator can start the live session. You will appear in the waiting room until admitted.
                          </p>
                        )}
                        {isLive && sessionState && (
                          <>
                            <Badge
                              className={
                                sessionState.myStatus === 'active'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }
                              style={{ fontSize: '11px' }}
                            >
                              {sessionState.myStatus === 'active' ? 'Admitted — panel' : 'Waiting room'}
                            </Badge>
                            {sessionState.myStatus === 'active' && (
                              <Button
                                className="bg-black hover:bg-gray-800 text-white"
                                onClick={() => handleOpenMarking(interview)}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Mark Candidates
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>

                  {isLive && sessionState && (
                    <Card className="border border-blue-200 rounded-lg p-4 bg-blue-50/80">
                      <p className="text-[#1e3a5f]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {sessionState.myStatus === 'waiting'
                          ? 'Waiting room — the coordinator will admit you when ready. You can review candidate details below.'
                          : 'You are admitted. Open the marking panel to score candidates using the coordinator’s scheme.'}
                      </p>
                      <p className="text-[#555555] mt-2" style={{ fontSize: '12px' }}>
                        Session started by {sessionState.startedByName ?? 'coordinator'}. Admitting participants is coordinator-only.
                      </p>
                    </Card>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>Total Candidates</p>
                      <p className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>{interview.candidateCount}</p>
                    </Card>
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>Interview Status</p>
                      <Badge className={isLive ? "bg-green-100 text-green-700 border-green-300 border" : "bg-blue-100 text-blue-700 border-blue-300 border"} style={{ fontSize: '12px' }}>
                        {isLive ? 'LIVE' : 'UPCOMING'}
                      </Badge>
                    </Card>
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>Days Until Interview</p>
                      <p className={`${days < 7 ? 'text-red-500' : 'text-[#4db4ac]'}`} style={{ fontSize: '24px', fontWeight: 700 }}>{days > 0 ? days : 0}</p>
                    </Card>
                  </div>

                  {/* Candidates Table */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-[#4db4ac]" />
                      <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>Candidates for This Interview</h4>
                      <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>{candidates.length}</Badge>
                    </div>

                    {isLoadingCands ? (
                      <div className="flex items-center gap-2 py-6 justify-center text-[#4db4ac]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span style={{ fontSize: '13px' }}>Loading candidates...</span>
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="text-center py-8 border border-[#e0e0e0] rounded-lg">
                        <Users className="h-8 w-8 text-[#d0d0d0] mx-auto mb-2" />
                        <p className="text-[#999999]" style={{ fontSize: '13px' }}>No candidates uploaded yet</p>
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
                                <TableCell className="text-[#555555] py-2" style={{ fontSize: '13px' }}>{index + 1}</TableCell>
                                <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 500 }}>{candidate.candidateId || '—'}</TableCell>
                                <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 600 }}>{candidate.name}</TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                                    <Mail className="h-3 w-3 text-[#4db4ac]" />{candidate.email}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                                    <Phone className="h-3 w-3 text-[#4db4ac]" />{candidate.phone}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  {candidate.cvUrl ? (
                                    <Button variant="outline" size="sm" className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]" onClick={() => window.open(candidate.cvUrl, '_blank')}>
                                      <FileText className="h-3 w-3 mr-1" />View CV
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

          {/* ── Ended Interviews ── */}
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
                      <Badge className="bg-gray-100 text-gray-600 border-gray-300 border" style={{ fontSize: '11px' }}>ENDED</Badge>
                      <span className="text-[#555555]" style={{ fontSize: '12px' }}>{interview.candidateCount} candidates</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>

    </div>
  );
}
