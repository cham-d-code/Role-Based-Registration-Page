import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  ArrowLeft, FileText, Save, Calendar as CalendarIcon, User,
  Plus, Trash2, CheckCircle, ClipboardList, Edit, Loader2,
} from 'lucide-react';
import { saveMarkingScheme, submitMarks, MarkingSchemeData } from '../services/api';

interface Candidate {
  /** Database UUID — required for save-marks API */
  id: string;
  /** Excel / display candidate id (e.g. C0001) — for labels only */
  displayId?: string;
  name: string;
  email: string;
  phone: string;
  cvUrl?: string;
}

interface Criterion {
  id: string;       // backend UUID once saved, or temp string during creation
  name: string;
  maxMarks: number;
}

interface InterviewMarkingPageProps {
  interview: { id: string; interviewNumber: string; date: string };
  candidates: Candidate[];
  onBack: () => void;
  /** If provided (mentor/HOD joining), skip scheme creation and use this scheme */
  existingScheme?: MarkingSchemeData;
  /**
   * When true (e.g. coordinator stepped off the active panel), hide candidate marks entry;
   * coordinator may still update the marking scheme below.
   */
  marksEntryDisabled?: boolean;
}

let _tempId = 1;
function tempId() { return `tmp-${_tempId++}`; }

export default function InterviewMarkingPage({
  interview, candidates, onBack, existingScheme, marksEntryDisabled = false,
}: InterviewMarkingPageProps) {

  // ── Scheme setup (coordinator only when no existingScheme) ─────────────────
  const [criteria, setCriteria] = useState<Criterion[]>(
    existingScheme
      ? existingScheme.criteria.map(c => ({ id: c.id, name: c.name, maxMarks: c.maxMarks }))
      : [{ id: tempId(), name: '', maxMarks: 0 }]
  );
  const [schemeFinalized, setSchemeFinalized] = useState(!!existingScheme);
  const [savingScheme, setSavingScheme] = useState(false);
  const [schemeError, setSchemeError] = useState('');

  // ── Marking state ──────────────────────────────────────────────────────────
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [additionalComments, setAdditionalComments] = useState('');
  const [savingMarks, setSavingMarks] = useState(false);
  const [savedResults, setSavedResults] = useState<
    { candidateId: string; displayId?: string; name: string; total: number; max: number }[]
  >([]);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const maxTotal = criteria.reduce((s, c) => s + (c.maxMarks || 0), 0);
  const currentTotal = criteria.reduce((s, c) => s + (parseInt(marks[c.id] || '0') || 0), 0);

  const isReadonlyScheme = !!existingScheme; // mentor/HOD can't edit scheme

  // ── Scheme helpers ─────────────────────────────────────────────────────────
  function addCriterion() {
    setCriteria(prev => [...prev, { id: tempId(), name: '', maxMarks: 0 }]);
  }
  function removeCriterion(id: string) {
    setCriteria(prev => prev.filter(c => c.id !== id));
  }
  function updateCriterion(id: string, field: 'name' | 'maxMarks', value: string) {
    setCriteria(prev => prev.map(c =>
      c.id === id
        ? { ...c, [field]: field === 'maxMarks' ? Math.max(0, parseInt(value) || 0) : value }
        : c
    ));
  }

  async function finalizeScheme() {
    if (criteria.length === 0) { setSchemeError('Add at least one criterion.'); return; }
    for (const c of criteria) {
      if (!c.name.trim()) { setSchemeError('Every criterion must have a name.'); return; }
      if (c.maxMarks <= 0) { setSchemeError(`"${c.name}" must have max marks > 0.`); return; }
    }
    setSavingScheme(true);
    setSchemeError('');
    try {
      const saved = await saveMarkingScheme(
        interview.id,
        criteria.map(c => ({ name: c.name, maxMarks: c.maxMarks }))
      );
      // Replace temp ids with real backend ids
      setCriteria(saved.criteria.map(c => ({ id: c.id, name: c.name, maxMarks: c.maxMarks })));
      setSchemeFinalized(true);
      setMarks({});
      setSelectedCandidateId('');
    } catch (e: any) {
      setSchemeError(e.message || 'Failed to save scheme.');
    } finally {
      setSavingScheme(false);
    }
  }

  /** Save scheme changes while on marking view (coordinator, panel not active for marks). */
  async function saveSchemeFromMarkingView() {
    if (criteria.length === 0) { setSchemeError('Add at least one criterion.'); return; }
    for (const c of criteria) {
      if (!c.name.trim()) { setSchemeError('Every criterion must have a name.'); return; }
      if (c.maxMarks <= 0) { setSchemeError(`"${c.name}" must have max marks > 0.`); return; }
    }
    setSavingScheme(true);
    setSchemeError('');
    try {
      const saved = await saveMarkingScheme(
        interview.id,
        criteria.map(c => ({ name: c.name, maxMarks: c.maxMarks }))
      );
      setCriteria(saved.criteria.map(c => ({ id: c.id, name: c.name, maxMarks: c.maxMarks })));
    } catch (e: any) {
      setSchemeError(e.message || 'Failed to save scheme.');
    } finally {
      setSavingScheme(false);
    }
  }

  // ── Marks helpers ──────────────────────────────────────────────────────────
  async function handleAssignMarks() {
    if (!selectedCandidateId) { alert('Please select a candidate.'); return; }
    for (const c of criteria) {
      const val = parseInt(marks[c.id] || '');
      if (isNaN(val)) { alert(`Please enter marks for "${c.name}".`); return; }
      if (val < 0 || val > c.maxMarks) {
        alert(`Marks for "${c.name}" must be 0–${c.maxMarks}.`); return;
      }
    }
    setSavingMarks(true);
    try {
      await submitMarks(
        interview.id,
        selectedCandidateId,
        criteria.map(c => ({ criterionId: c.id, marksGiven: parseInt(marks[c.id]) })),
        additionalComments
      );
      setSavedResults(prev => {
        const idx = prev.findIndex(r => r.candidateId === selectedCandidateId);
        const entry = {
          candidateId: selectedCandidateId,
          displayId: selectedCandidate!.displayId,
          name: selectedCandidate!.name,
          total: currentTotal,
          max: maxTotal,
        };
        return idx >= 0 ? prev.map((r, i) => i === idx ? entry : r) : [...prev, entry];
      });
      alert(`Marks saved for ${selectedCandidate?.name}!`);
      setMarks({});
      setAdditionalComments('');
      setSelectedCandidateId('');
    } catch (e: any) {
      alert(`Failed to save marks: ${e.message}`);
    } finally {
      setSavingMarks(false);
    }
  }

  // ── Phase 1: Scheme Setup (coordinator only) ───────────────────────────────
  if (!schemeFinalized) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-[#3c9a93]" onClick={onBack}>
              <ArrowLeft className="h-5 w-5 mr-2" />Back
            </Button>
            <Separator orientation="vertical" className="h-8 bg-white/30" />
            <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>
              {interview.interviewNumber} — Create Marking Assignment
            </h1>
          </div>
          <Badge className="bg-white text-[#4db4ac] border-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            {interview.date}
          </Badge>
        </header>

        <div className="pt-24 pb-8 px-6 max-w-3xl mx-auto">
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-6 w-6 text-[#4db4ac]" />
              <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                Create Marking Assignment
              </h2>
            </div>
            <p className="text-[#555555] mb-4" style={{ fontSize: '13px' }}>
              Define the criteria that panelists will use to mark each candidate.
            </p>
            <Separator className="mb-5" />

            <div className="space-y-3 mb-5">
              {criteria.map((criterion, idx) => (
                <div key={criterion.id} className="flex items-center gap-3 bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg px-4 py-3">
                  <span className="h-6 w-6 rounded-full bg-[#4db4ac] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <Label className="text-[#555555] flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600 }}>Criteria Name</Label>
                  <Input
                    placeholder="e.g., Communication Skills"
                    value={criterion.name}
                    onChange={e => updateCriterion(criterion.id, 'name', e.target.value)}
                    className="flex-1 bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]"
                    style={{ minWidth: 0 }}
                  />
                  <Label className="text-[#555555] flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600 }}>Max Marks</Label>
                  <div className="relative flex-shrink-0 w-24">
                    <Input
                      type="number" min="1" placeholder="0"
                      value={criterion.maxMarks || ''}
                      onChange={e => updateCriterion(criterion.id, 'maxMarks', e.target.value)}
                      className="bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] pr-10 text-center"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" style={{ fontSize: '11px' }}>pts</span>
                  </div>
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => removeCriterion(criterion.id)}
                    disabled={criteria.length === 1}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline" onClick={addCriterion}
              className="w-full border-2 border-dashed border-[#2d8a82] text-[#1a5c57] bg-[#f0faf9] hover:bg-[#e6f7f6] mb-6 font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />Add Marking Criterion
            </Button>

            <div className="rounded-lg p-4 mb-4 flex items-center justify-between border-2 border-[#2d8a82]" style={{ backgroundColor: '#e8f4f3' }}>
              <div>
                <p className="text-neutral-900" style={{ fontSize: '13px', fontWeight: 700 }}>
                  {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'} defined
                </p>
                <p className="text-neutral-700" style={{ fontSize: '12px' }}>
                  Total max marks: <strong className="text-neutral-900">{maxTotal}</strong>
                </p>
              </div>
              <Badge className="bg-[#1a5c57] text-white border-0 text-lg px-4 py-1">/ {maxTotal}</Badge>
            </div>

            {schemeError && (
              <p className="text-red-500 text-sm mb-3">{schemeError}</p>
            )}

            <div className="flex flex-wrap gap-3 justify-end items-center">
              <Button variant="outline" onClick={onBack} className="border-neutral-400 text-neutral-800 bg-white">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={finalizeScheme} disabled={savingScheme}
                className="min-h-11 px-8 text-base font-semibold shadow-lg ring-2 ring-neutral-900 ring-offset-2 border-2 border-neutral-900"
                style={{ backgroundColor: '#171717', color: '#ffffff' }}
              >
                {savingScheme
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : <><CheckCircle className="h-5 w-5 mr-2" />Save marking scheme</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Phase 2: Marking Panel ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-white hover:bg-[#3c9a93]" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 mr-2" />Back
          </Button>
          <Separator orientation="vertical" className="h-8 bg-white/30" />
          <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>
            {interview.interviewNumber} — {marksEntryDisabled ? 'Marking scheme' : 'Marking Assignment'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isReadonlyScheme && !marksEntryDisabled && (
            <Button
              size="sm" variant="ghost"
              className="text-white hover:bg-[#3c9a93] border border-white/40"
              onClick={() => { setSchemeFinalized(false); setMarks({}); setSelectedCandidateId(''); }}
            >
              <Edit className="h-3 w-3 mr-1" />Edit Scheme
            </Button>
          )}
          <Badge className="bg-white text-[#4db4ac] border-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            {interview.date}
          </Badge>
        </div>
      </header>

      <div className="pt-24 pb-8 px-6 max-w-5xl mx-auto space-y-6">

        {marksEntryDisabled && (
          <Card className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-950" style={{ fontSize: '14px', fontWeight: 600 }}>
              You are not on the active marking panel
            </p>
            <p className="text-amber-900 mt-1" style={{ fontSize: '13px' }}>
              Join the live panel again from Manage Interviews to enter candidate marks. You can still update the marking scheme below.
            </p>
          </Card>
        )}

        {/* Scheme summary (read-only when entering marks) */}
        {!marksEntryDisabled && (
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#4db4ac]" />
                <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '17px' }}>Marking Scheme</h2>
                {existingScheme && (
                  <span className="text-[#555555] text-xs">Created by {existingScheme.createdByName}</span>
                )}
              </div>
              <Badge className="bg-[#4db4ac] text-white border-0">Total: {maxTotal} pts</Badge>
            </div>
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {criteria.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-1 bg-[#f0faf9] border border-[#4db4ac] rounded-lg px-3 py-1">
                  <span className="text-[#4db4ac] font-semibold text-xs">{idx + 1}.</span>
                  <span className="text-[#222222] font-semibold text-sm">{c.name}</span>
                  <span className="text-[#555555] text-xs">({c.maxMarks} pts)</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Editable scheme (coordinator off active panel) */}
        {marksEntryDisabled && (
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Edit className="h-5 w-5 text-[#4db4ac]" />
              <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '17px' }}>Edit marking scheme</h2>
            </div>
            <p className="text-[#555555] mb-4" style={{ fontSize: '13px' }}>
              Changes apply to all panel markers. Total: <strong>{maxTotal}</strong> pts
            </p>
            <Separator className="mb-4" />
            <div className="space-y-3 mb-5">
              {criteria.map((criterion, idx) => (
                <div key={criterion.id} className="flex items-center gap-3 bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg px-4 py-3">
                  <span className="h-6 w-6 rounded-full bg-[#4db4ac] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <Label className="text-[#555555] flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600 }}>Criteria</Label>
                  <Input
                    placeholder="Criterion name"
                    value={criterion.name}
                    onChange={e => updateCriterion(criterion.id, 'name', e.target.value)}
                    className="flex-1 bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]"
                    style={{ minWidth: 0 }}
                  />
                  <Label className="text-[#555555] flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600 }}>Max</Label>
                  <div className="relative flex-shrink-0 w-24">
                    <Input
                      type="number" min="1"
                      value={criterion.maxMarks || ''}
                      onChange={e => updateCriterion(criterion.id, 'maxMarks', e.target.value)}
                      className="bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] text-center"
                    />
                  </div>
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => removeCriterion(criterion.id)}
                    disabled={criteria.length === 1}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline" onClick={addCriterion}
              className="w-full border-2 border-dashed border-[#2d8a82] text-[#1a5c57] bg-[#f0faf9] hover:bg-[#e6f7f6] mb-4 font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />Add criterion
            </Button>
            {schemeError && <p className="text-red-500 text-sm mb-3">{schemeError}</p>}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={saveSchemeFromMarkingView}
                disabled={savingScheme}
                className="min-h-11 px-8 font-semibold bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
              >
                {savingScheme ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save marking scheme</>}
              </Button>
            </div>
          </Card>
        )}

        {/* Interview info */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-5 w-5 text-[#4db4ac]" />
            <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '17px' }}>Interview Details</h2>
          </div>
          <Separator className="mb-3" />
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Interview', value: interview.interviewNumber },
              { label: 'Date', value: interview.date },
              { label: 'Total Candidates', value: String(candidates.length) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#f9f9f9] rounded-lg p-4 border border-[#e0e0e0]">
                <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>{label}</p>
                <p className="text-[#222222]" style={{ fontSize: '15px', fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {!marksEntryDisabled && (
        <>
        {/* Candidate selection */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-5 w-5 text-[#4db4ac]" />
            <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '17px' }}>Select Candidate</h2>
          </div>
          <Separator className="mb-3" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>Candidate *</Label>
              <Select value={selectedCandidateId} onValueChange={v => { setSelectedCandidateId(v); setMarks({}); }}>
                <SelectTrigger className="w-full bg-white border-2 border-neutral-300 rounded-lg text-neutral-900 data-[placeholder]:text-neutral-500">
                  <SelectValue placeholder="Select candidate to mark" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="text-[#4db4ac] font-semibold mr-1">{c.displayId || c.id.slice(0, 8)}</span> — {c.name}
                      {savedResults.find(r => r.candidateId === c.id) && (
                        <span className="ml-2 text-green-600 text-xs">✓ marked</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                type="button"
                className="w-full border-2 border-neutral-700 text-neutral-900 bg-neutral-50 hover:bg-[#e8f4f3] font-semibold"
                disabled={!selectedCandidateId || !selectedCandidate?.cvUrl}
                onClick={() => window.open(selectedCandidate?.cvUrl, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" />View CV
              </Button>
            </div>
          </div>
          {selectedCandidate && (
            <div className="mt-4 rounded-lg p-4 border-2 border-[#2d8a82]" style={{ backgroundColor: '#e8f4f3' }}>
              <p className="text-neutral-900 mb-2" style={{ fontSize: '13px', fontWeight: 700 }}>Selected Candidate:</p>
              <div className="grid grid-cols-3 gap-3 text-[#222222]" style={{ fontSize: '13px' }}>
                <div>
                  <span className="text-[#555555]">Candidate ID: </span>
                  <span style={{ fontWeight: 600 }}>{selectedCandidate.displayId || '—'}</span>
                  <span className="text-[#999999] text-xs block mt-0.5">Ref: {selectedCandidate.id.slice(0, 8)}…</span>
                </div>
                <div><span className="text-[#555555]">Email: </span>{selectedCandidate.email}</div>
                <div><span className="text-[#555555]">Phone: </span>{selectedCandidate.phone}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Marks entry */}
        <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-[#4db4ac]" />
            <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '17px' }}>Enter Marks</h2>
          </div>
          <Separator className="mb-4" />
          <div className="space-y-3 mb-5">
            {criteria.map((criterion, idx) => (
              <div key={criterion.id} className="grid grid-cols-[1fr_200px] gap-4 items-center p-3 bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg">
                <div>
                  <p className="text-[#555555]" style={{ fontSize: '11px', fontWeight: 600 }}>CRITERION {idx + 1}</p>
                  <p className="text-[#222222]" style={{ fontSize: '15px', fontWeight: 600 }}>{criterion.name}</p>
                  <p className="text-neutral-600" style={{ fontSize: '12px', fontWeight: 500 }}>Maximum: {criterion.maxMarks} marks</p>
                </div>
                <div>
                  <Label className="text-[#222222] mb-1 block" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Marks (0 – {criterion.maxMarks})
                  </Label>
                  <Input
                    type="number" min="0" max={criterion.maxMarks} placeholder="0"
                    value={marks[criterion.id] || ''}
                    onChange={e => setMarks(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                    disabled={!selectedCandidateId}
                    className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total — solid light panel + dark text (avoid teal-on-teal / broken bg-opacity) */}
          <div
            className="rounded-lg p-4 mb-5 flex items-center justify-between border-2 border-[#2d8a82] shadow-sm"
            style={{ backgroundColor: '#e8f4f3' }}
          >
            <div>
              <p className="text-neutral-900" style={{ fontSize: '15px', fontWeight: 700 }}>Total Marks</p>
              <p className="text-neutral-700" style={{ fontSize: '13px', fontWeight: 500 }}>
                Across {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}
              </p>
            </div>
            <p className="text-neutral-900 tabular-nums" style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.1 }}>
              {currentTotal}{' '}
              <span className="text-neutral-600" style={{ fontSize: '22px', fontWeight: 600 }}>/ {maxTotal}</span>
            </p>
          </div>

          {/* Comments */}
          <div className="mb-5">
            <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Additional Comments
            </Label>
            <Textarea
              placeholder="Enter observations about the candidate's performance…"
              value={additionalComments}
              onChange={e => setAdditionalComments(e.target.value)}
              className="w-full min-h-[90px] bg-white border-2 border-neutral-300 rounded-lg focus:border-[#2d8a82] placeholder:text-neutral-500 placeholder:opacity-100 text-neutral-900"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div className="flex gap-3 justify-end flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="min-h-10 border-2 border-neutral-600 text-neutral-900 bg-neutral-100 hover:bg-neutral-200 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11 px-8 font-semibold shadow-lg ring-2 ring-neutral-900 ring-offset-2 border-2 border-neutral-900"
              style={{ backgroundColor: '#171717', color: '#ffffff' }}
              onClick={handleAssignMarks}
              disabled={!selectedCandidateId || savingMarks}
            >
              {savingMarks
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                : <><Save className="h-4 w-4 mr-2" />Save Marks</>}
            </Button>
          </div>
        </Card>

        {/* Saved results */}
        {savedResults.length > 0 && (
          <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '17px' }}>
                Marked Candidates ({savedResults.length})
              </h2>
            </div>
            <Separator className="mb-3" />
            <div className="space-y-2">
              {savedResults.map(r => (
                <div key={r.candidateId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>{r.name}</p>
                    <p className="text-[#555555]" style={{ fontSize: '12px' }}>
                      ID: {r.displayId || r.candidateId.slice(0, 8)}…
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-700" style={{ fontSize: '18px', fontWeight: 700 }}>{r.total} / {r.max}</p>
                    <p className="text-green-500" style={{ fontSize: '11px' }}>
                      {r.max > 0 ? Math.round((r.total / r.max) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        </>
        )}
      </div>
    </div>
  );
}
