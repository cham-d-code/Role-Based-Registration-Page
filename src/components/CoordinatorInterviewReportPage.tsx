import { useState, useEffect, Fragment } from 'react';
import {
  ArrowLeft, Loader2, Send, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  getInterviewReport,
  releaseInterviewReportToHod,
  getInterviews,
  InterviewReport,
  InterviewData,
  CandidateReport,
} from '../services/api';

interface CoordinatorInterviewReportPageProps {
  interviewId: string;
  onClose: () => void;
}

export default function CoordinatorInterviewReportPage({ interviewId, onClose }: CoordinatorInterviewReportPageProps) {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interviewRow, setInterviewRow] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(false);
  const [detailCandidateId, setDetailCandidateId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [rep, all] = await Promise.all([
          getInterviewReport(interviewId),
          getInterviews(),
        ]);
        if (cancelled) return;
        setReport(rep);
        setInterviewRow(all.find(i => i.id === interviewId) ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [interviewId]);

  async function handleSendForHodReview() {
    if (!confirm('Send averaged results to all HODs for review?')) return;
    setReleasing(true);
    try {
      const updated = await releaseInterviewReportToHod(interviewId);
      setInterviewRow(prev =>
        prev ? { ...prev, reportSentToHodAt: updated.reportSentToHodAt ?? prev.reportSentToHodAt } : prev,
      );
      try {
        setReport(await getInterviewReport(interviewId));
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to send report to HOD.');
    } finally {
      setReleasing(false);
    }
  }

  function markerCountForRow(cand: CandidateReport): number {
    return Math.max(cand.markerResults?.length ?? 0, cand.markersIncludedCount ?? 0);
  }

  function formatAvgCell(value: number | undefined | null): string {
    if (value == null || Number.isNaN(value)) return '—';
    if (value === 0) return '0';
    return String(value);
  }

  const sentToHod = Boolean(interviewRow?.reportSentToHodAt);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e0e0] bg-[#4db4ac] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button type="button" onClick={onClose} variant="ghost" className="text-white hover:bg-[#3c9a93] shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-lg truncate">
              Averaged results
              {report?.interviewNumber ? ` · ${report.interviewNumber}` : ''}
            </h1>
            {interviewRow && (
              <p className="text-green-100 text-xs truncate">
                {interviewRow.date} · {interviewRow.candidateCount} candidates
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sentToHod ? (
            <Badge className="bg-green-100 text-green-900 border-green-300 border">Sent to HOD</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-950 border-amber-300 border">Not sent to HOD</Badge>
          )}
          {!sentToHod && (
            <Button
              type="button"
              variant="secondary"
              className="bg-white text-[#1a5c57] hover:bg-[#e6f7f6] font-semibold border-0 shadow-sm"
              disabled={releasing || loading || !!error}
              onClick={handleSendForHodReview}
            >
              {releasing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin inline" />Sending…</>
              ) : (
                <><Send className="h-4 w-4 mr-2 inline" />Send for HOD review</>
              )}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-[#4db4ac]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Loading report…</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>
        )}
        {!loading && !error && report && (
          <div className="space-y-6 overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-[#e0e0e0] bg-[#f9f9f9] p-3">
                <p className="text-[#999] text-xs font-semibold uppercase tracking-wide">Interview</p>
                <p className="text-[#222] font-semibold">{report.interviewNumber}</p>
              </div>
              <div className="rounded-lg border border-[#e0e0e0] bg-[#f9f9f9] p-3">
                <p className="text-[#999] text-xs font-semibold uppercase tracking-wide">Session id</p>
                <p className="text-[#222] font-mono text-xs break-all">{report.sessionId}</p>
              </div>
              <div className="rounded-lg border border-[#e0e0e0] bg-[#f9f9f9] p-3">
                <p className="text-[#999] text-xs font-semibold uppercase tracking-wide">Scheme</p>
                <p className="text-[#222] font-semibold">
                  {report.criteria.length} criteria · max {report.totalMaxMarks} pts
                </p>
              </div>
              <div className="rounded-lg border border-[#e0e0e0] bg-[#f9f9f9] p-3">
                <p className="text-[#999] text-xs font-semibold uppercase tracking-wide">Candidates</p>
                <p className="text-[#222] font-semibold">{report.candidates.length} in report</p>
              </div>
            </div>

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden min-w-[720px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9f9f9]">
                    <TableHead className="w-10 text-[#222222] font-semibold" />
                    <TableHead className="text-[#222222] font-semibold">#</TableHead>
                    <TableHead className="text-[#222222] font-semibold">Candidate ID</TableHead>
                    <TableHead className="text-[#222222] font-semibold">Name</TableHead>
                    <TableHead className="text-[#222222] font-semibold">Email</TableHead>
                    {report.criteria.map(c => (
                      <TableHead key={c.id} className="text-center text-[#222222] font-semibold text-xs">
                        {c.name} <span className="text-[#4db4ac]">/{c.maxMarks}</span>
                        <div className="text-[#999] font-normal">avg</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-[#222222] font-semibold bg-[#e6f7f6]">
                      Avg total <span className="text-[#4db4ac]">/{report.totalMaxMarks}</span>
                    </TableHead>
                    <TableHead className="text-center text-xs text-[#555555]">Markers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.candidates.map((cand, ci) => (
                    <Fragment key={cand.candidateId}>
                      <TableRow className="align-middle">
                        <TableCell className="py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-expanded={detailCandidateId === cand.candidateId}
                            onClick={() =>
                              setDetailCandidateId(
                                detailCandidateId === cand.candidateId ? null : cand.candidateId,
                              )}
                          >
                            {detailCandidateId === cand.candidateId ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-[#555555]">{ci + 1}</TableCell>
                        <TableCell className="font-medium">{cand.displayCandidateId || '—'}</TableCell>
                        <TableCell className="font-semibold text-[#222222]">{cand.candidateName}</TableCell>
                        <TableCell className="text-[#555555] text-xs max-w-[200px] truncate" title={cand.candidateEmail}>
                          {cand.candidateEmail || '—'}
                        </TableCell>
                        {report.criteria.map(c => (
                          <TableCell key={c.id} className="text-center font-semibold">
                            {formatAvgCell(cand.averageMarksByCriterion?.[c.id])}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold text-[#4db4ac] bg-[#f6fffd]">
                          {formatAvgCell(cand.averageTotal)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-[#555555]">
                          {markerCountForRow(cand)}
                        </TableCell>
                      </TableRow>
                      {detailCandidateId === cand.candidateId && (
                        <TableRow className="bg-[#fafafa]">
                          <TableCell colSpan={7 + report.criteria.length} className="p-4 border-t border-[#e8e8e8]">
                            <p className="text-xs font-semibold text-[#555] mb-2 uppercase tracking-wide">
                              Marker breakdown
                            </p>
                            {(!cand.markerResults || cand.markerResults.length === 0) ? (
                              <p className="text-sm text-[#999]">No per-marker rows for this candidate.</p>
                            ) : (
                              <div className="border border-[#e0e0e0] rounded-lg overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-white">
                                      <TableHead className="text-xs">Marker</TableHead>
                                      <TableHead className="text-xs">Role</TableHead>
                                      {report.criteria.map(c => (
                                        <TableHead key={c.id} className="text-center text-xs">
                                          {c.name} /{c.maxMarks}
                                        </TableHead>
                                      ))}
                                      <TableHead className="text-center text-xs">Total</TableHead>
                                      <TableHead className="text-xs min-w-[160px]">Comments</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cand.markerResults.map(m => (
                                      <TableRow key={m.markerId}>
                                        <TableCell className="text-sm font-medium">{m.markerName}</TableCell>
                                        <TableCell className="text-xs text-[#666]">{m.markerRole}</TableCell>
                                        {report.criteria.map(c => (
                                          <TableCell key={c.id} className="text-center text-sm">
                                            {m.marksByCriterion?.[c.id] ?? '—'}
                                          </TableCell>
                                        ))}
                                        <TableCell className="text-center text-sm font-semibold">{m.total}</TableCell>
                                        <TableCell className="text-xs text-[#555] max-w-[240px]">
                                          {m.comments || '—'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
