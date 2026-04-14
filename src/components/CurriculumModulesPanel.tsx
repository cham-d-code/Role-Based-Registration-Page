import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCurriculumModules,
  createCurriculumModule,
  updateCurriculumModule,
  notifyCurriculumModules,
  type CurriculumModuleDto,
} from '../services/api';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { BellRing, Edit, Loader2, Plus, Send } from 'lucide-react';

const LEVELS = [1, 2, 3, 4] as const;

function formatSpecialization(m: CurriculumModuleDto): string {
  if (m.programKind === 'ALL') return 'MIT/IT';
  if (m.programKind === 'MIT') {
    return m.mitTrack ? `MIT (${m.mitTrack})` : 'MIT';
  }
  return 'IT';
}

function chiefDisplay(t?: string | null) {
  if (t == null || String(t).trim() === '') return '—';
  return t;
}

export default function CurriculumModulesPanel() {
  const [modules, setModules] = useState<CurriculumModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formChief, setFormChief] = useState('');
  const [formLevel, setFormLevel] = useState('1');
  const [formSemester, setFormSemester] = useState('1');
  const [formCredits, setFormCredits] = useState('3');
  const [formComp, setFormComp] = useState('C');
  const [formKind, setFormKind] = useState<'IT' | 'MIT' | 'ALL'>('IT');
  const [formMitTrack, setFormMitTrack] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurriculumModules({
        semester: semesterFilter,
        programKind: programFilter,
      });
      setModules(data);
    } catch (e) {
      console.error(e);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [semesterFilter, programFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const byLevel = useMemo(() => {
    const map = new Map<number, CurriculumModuleDto[]>();
    for (const lv of LEVELS) map.set(lv, []);
    for (const m of modules) {
      const list = map.get(m.academicLevel);
      if (list) list.push(m);
    }
    return map;
  }, [modules]);

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(modules.map((m) => m.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const openAdd = () => {
    setFormMode('add');
    setEditingId(null);
    setFormCode('');
    setFormName('');
    setFormChief('');
    setFormLevel('1');
    setFormSemester('1');
    setFormCredits('3');
    setFormComp('C');
    setFormKind('IT');
    setFormMitTrack('');
    setFormOpen(true);
  };

  const openEdit = (m: CurriculumModuleDto) => {
    setFormMode('edit');
    setEditingId(m.id);
    setFormCode(m.code);
    setFormName(m.name);
    setFormChief(m.chiefTutor ?? '');
    setFormLevel(String(m.academicLevel));
    setFormSemester(m.semesterLabel);
    setFormCredits(String(m.credits));
    setFormComp(m.compulsoryOptional);
    setFormKind(m.programKind === 'MIT' ? 'MIT' : m.programKind === 'ALL' ? 'ALL' : 'IT');
    setFormMitTrack(m.mitTrack ?? '');
    setFormOpen(true);
  };

  const saveForm = async () => {
    const credits = parseInt(formCredits, 10);
    if (!formCode.trim() || !formName.trim()) {
      alert('Code and name are required.');
      return;
    }
    if (Number.isNaN(credits) || credits < 1) {
      alert('Credits must be a positive number.');
      return;
    }
    const level = parseInt(formLevel, 10);
    if (level < 1 || level > 4) {
      alert('Level must be 1–4.');
      return;
    }
    const body = {
      code: formCode.trim(),
      name: formName.trim(),
      academicLevel: level,
      semesterLabel: formSemester.trim(),
      credits,
      compulsoryOptional: formComp,
      chiefTutor: formChief.trim() || undefined,
      programKind: formKind,
      mitTrack: formKind === 'MIT' && formMitTrack ? formMitTrack : null,
    };
    try {
      if (formMode === 'add') {
        await createCurriculumModule(body);
      } else if (editingId) {
        await updateCurriculumModule(editingId, body);
      }
      setFormOpen(false);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const sendNotify = async () => {
    if (selected.size === 0) {
      alert('Select at least one module.');
      return;
    }
    try {
      const res = await notifyCurriculumModules(Array.from(selected), notifyMessage.trim() || undefined);
      alert(`${res.message}\nStaff count: ${res.staffNotified}\nModules: ${res.moduleCount}`);
      setNotifyOpen(false);
      setNotifyMessage('');
      clearSelection();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Notification failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-[#555555] text-xs font-semibold">Semester</Label>
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="w-[160px] border-[#e0e0e0]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[#555555] text-xs font-semibold">Programme</Label>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[160px] border-[#e0e0e0]">
              <SelectValue placeholder="IT / MIT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="IT">IT only</SelectItem>
              <SelectItem value="MIT">MIT only</SelectItem>
              <SelectItem value="ALL">MIT/IT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-[#4db4ac] text-[#4db4ac]"
          onClick={selectAllVisible}
        >
          Select all (visible)
        </Button>
        <Button type="button" variant="outline" onClick={clearSelection}>
          Clear selection
        </Button>
        <Button
          type="button"
          className="ml-auto bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
          onClick={() => setNotifyOpen(true)}
          disabled={selected.size === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          Send module notification ({selected.size})
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-[#4db4ac] text-[#4db4ac]"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add new module
        </Button>
      </div>

      <Separator />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-[#4db4ac]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading modules…</span>
        </div>
      )}

      {!loading && modules.length === 0 && (
        <p className="text-center text-[#888888] py-8">No modules match the current filters.</p>
      )}

      {!loading &&
        LEVELS.map((level) => {
          const rows = byLevel.get(level) ?? [];
          if (rows.length === 0) return null;
          return (
            <div key={level} className="space-y-2">
              <h4 className="text-[#222222] font-bold" style={{ fontSize: '18px' }}>
                Level {level}
              </h4>
              <div className="overflow-x-auto rounded-md border border-[#e0e0e0]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#7c1520] text-white">
                      <th className="w-10 px-2 py-3 text-left font-semibold" />
                      <th className="px-3 py-3 text-left font-semibold">Module code</th>
                      <th className="px-3 py-3 text-left font-semibold">Name</th>
                      <th className="px-3 py-3 text-left font-semibold">Chief tutor</th>
                      <th className="px-3 py-3 text-left font-semibold">Specialization</th>
                      <th className="px-3 py-3 text-left font-semibold">Semester</th>
                      <th className="px-3 py-3 text-left font-semibold">C/O</th>
                      <th className="px-3 py-3 text-left font-semibold">Cr.</th>
                      <th className="px-3 py-3 text-left font-semibold w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m, idx) => (
                      <tr
                        key={m.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}
                      >
                        <td className="px-2 py-2 align-middle">
                          <Checkbox
                            checked={selected.has(m.id)}
                            onCheckedChange={(c) => toggleOne(m.id, c === true)}
                            className="data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-[#222222] whitespace-nowrap">{m.code}</td>
                        <td className="px-3 py-2 text-[#333333] min-w-[200px]">{m.name}</td>
                        <td className="px-3 py-2 text-[#555555]">{chiefDisplay(m.chiefTutor)}</td>
                        <td className="px-3 py-2 text-[#555555] whitespace-nowrap">
                          {formatSpecialization(m)}
                        </td>
                        <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{m.semesterLabel}</td>
                        <td className="px-3 py-2 text-[#555555]">{m.compulsoryOptional}</td>
                        <td className="px-3 py-2 text-[#555555]">{m.credits}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-[#7c1520] text-[#7c1520] hover:bg-[#f8e8ea]"
                            onClick={() => openEdit(m)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-[#4db4ac]" />
              Send module notification
            </DialogTitle>
            <DialogDescription>
              Notify approved temporary staff about {selected.size} selected module(s). Optional message below.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional message to include…"
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#4db4ac] hover:bg-[#3c9a93]" onClick={sendNotify}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'add' ? 'Add module' : 'Edit module'}</DialogTitle>
            <DialogDescription>Update programme details. Chief tutor can be set later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Module code</Label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Chief tutor</Label>
              <Input value={formChief} onChange={(e) => setFormChief(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Level</Label>
                <Select value={formLevel} onValueChange={setFormLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Semester</Label>
                <Input
                  value={formSemester}
                  onChange={(e) => setFormSemester(e.target.value)}
                  placeholder="1, 2, 1 & 2…"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Credits</Label>
                <Input value={formCredits} onChange={(e) => setFormCredits(e.target.value)} type="number" min={1} />
              </div>
              <div className="grid gap-1">
                <Label>Compulsory / Optional</Label>
                <Select value={formComp} onValueChange={setFormComp}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Programme</Label>
                <Select value={formKind} onValueChange={(v) => setFormKind(v as 'IT' | 'MIT' | 'ALL')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="MIT">MIT</SelectItem>
                    <SelectItem value="ALL">MIT/IT (common)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formKind === 'MIT' && (
                <div className="grid gap-1">
                  <Label>MIT track (optional)</Label>
                  <Select value={formMitTrack || 'none'} onValueChange={(v) => setFormMitTrack(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="BSE / OSCM / IS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="BSE">BSE</SelectItem>
                      <SelectItem value="OSCM">OSCM</SelectItem>
                      <SelectItem value="IS">IS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#4db4ac] hover:bg-[#3c9a93]" onClick={saveForm}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
