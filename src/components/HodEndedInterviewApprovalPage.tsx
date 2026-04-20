import { useEffect, useMemo, useState } from 'react';
import { downloadInterviewReportExcel, getInterviewReport, type InterviewReport } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  CheckCircle,
  Calendar,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';

interface Interview {
  id: string;
  interviewNumber: string;
  date: string;
  candidateCount: number;
  averageMarks?: number;
  passedCandidates?: number;
}

interface HodEndedInterviewApprovalPageProps {
  interview: Interview;
  onBack: () => void;
}

export default function HodEndedInterviewApprovalPage({ interview, onBack }: HodEndedInterviewApprovalPageProps) {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<InterviewReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const rep = await getInterviewReport(interview.id);
        if (!cancelled) setReport(rep);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interview.id]);

  const sortedCandidates = useMemo(() => {
    const rows = report?.candidates ?? [];
    return [...rows].sort((a, b) => (b.averageTotal ?? 0) - (a.averageTotal ?? 0));
  }, [report]);

  // "Shortlist" preview: top 3 by average total.
  const shortlistedCandidates = useMemo(() => sortedCandidates.slice(0, 3), [sortedCandidates]);
  const overallAverage = useMemo(() => {
    if (!sortedCandidates.length) return null;
    const avg = sortedCandidates.reduce((sum, c) => sum + (c.averageTotal ?? 0), 0) / sortedCandidates.length;
    return Math.round(avg * 10) / 10;
  }, [sortedCandidates]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white hover:bg-[#3c9a93]"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
          <Separator orientation="vertical" className="h-8 bg-white/30" />
          <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>
            {interview.interviewNumber} — Interview review
          </h1>
        </div>
        
        <Button
          variant="ghost"
          className="text-white hover:bg-[#3c9a93]"
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadInterviewReportExcel(interview.id);
            } catch (e: unknown) {
              alert(e instanceof Error ? e.message : 'Failed to download report.');
            } finally {
              setDownloading(false);
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Downloading…' : 'Download Report'}
        </Button>
      </header>

      <div className="pt-20 pb-8 px-6 max-w-7xl mx-auto">
        {/* Interview Summary */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#4db4ac]" />
              <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '22px' }}>
                Interview Report Summary
              </h2>
            </div>
            <Badge className="bg-[#e6f7f6] text-[#2a7a72] border-[#4db4ac] border">
              HOD REVIEW
            </Badge>
          </div>
          
          <Separator className="mb-6" />

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  INTERVIEW DATE
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                {new Date(interview.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  TOTAL CANDIDATES
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                {sortedCandidates.length}
              </p>
            </div>

            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  AVERAGE MARKS
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                {overallAverage != null ? overallAverage.toFixed(1) : 'N/A'}
              </p>
            </div>

            <div className="bg-[#e6f7f6] rounded-lg p-4 border-l-4 border-[#4db4ac]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-[#4db4ac]" />
                <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  SHORTLISTED
                </p>
              </div>
              <p className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                {shortlistedCandidates.length}
              </p>
            </div>
          </div>

        </Card>

        {/* Shortlisted Candidates */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '18px' }}>
              Shortlisted Candidates ({shortlistedCandidates.length})
            </h3>
            <Badge className="bg-green-100 text-green-700 border-green-300 border">
              RECOMMENDED FOR HIRING
            </Badge>
          </div>
          
          <Separator className="mb-4" />

          {loading && (
            <div className="py-10 text-center text-[#4db4ac]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Loading report…
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {!loading && !error && report && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9f9f9]">
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Rank
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Candidate Name
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Email
                  </TableHead>
                  {report.criteria.map(c => (
                    <TableHead key={c.id} className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {c.name} <span className="text-[#4db4ac]">/{c.maxMarks}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Avg total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortlistedCandidates.map((candidate, index) => (
                  <TableRow key={candidate.candidateId} className="hover:bg-[#f9f9f9]">
                    <TableCell>
                      <Badge className="bg-[#4db4ac] text-white">
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {candidate.candidateName}
                    </TableCell>
                    <TableCell className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {candidate.candidateEmail}
                    </TableCell>
                    {report.criteria.map(c => (
                      <TableCell key={c.id} className="text-center text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {candidate.averageMarksByCriterion?.[c.id] ?? '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border-green-300 border" style={{ fontSize: '13px', fontWeight: 700 }}>
                        {candidate.averageTotal}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </Card>

        {/* All Candidates Performance */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[#4db4ac]" />
            <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '18px' }}>
              Complete Candidate Ranking ({sortedCandidates.length})
            </h3>
          </div>
          
          <Separator className="mb-4" />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9f9f9]">
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Rank
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Candidate Name
                  </TableHead>
                  <TableHead className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Email
                  </TableHead>
                  {report?.criteria?.map(c => (
                    <TableHead key={c.id} className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {c.name} <span className="text-[#4db4ac]">/{c.maxMarks}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Avg total
                  </TableHead>
                  <TableHead className="text-[#555555] text-center" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCandidates.map((candidate, index) => (
                  <TableRow key={candidate.candidateId} className={`hover:bg-[#f9f9f9] ${index < 3 ? 'bg-green-50/50' : ''}`}>
                    <TableCell>
                      <div className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                        #{index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {candidate.candidateName}
                    </TableCell>
                    <TableCell className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {candidate.candidateEmail}
                    </TableCell>
                    {report?.criteria?.map(c => (
                      <TableCell key={c.id} className="text-center text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {candidate.averageMarksByCriterion?.[c.id] ?? '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {candidate.averageTotal}
                    </TableCell>
                    <TableCell className="text-center">
                      {index < 3 ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 border">
                          Recommended
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 border-gray-300 border">
                          Not recommended
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
