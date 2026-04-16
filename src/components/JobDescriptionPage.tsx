import { useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Briefcase, BookOpen, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { getCurriculumModules, type CurriculumModuleDto } from '../services/api';
import EditPrimaryResponsibilitiesDialog, { loadPrimaryResponsibilitiesText } from './EditPrimaryResponsibilitiesDialog';
import { upsertJobDescriptionForStaff } from '../services/api';

type Task = {
  id: string;
  description: string;
  type: 'academic' | 'administrative';
};

type DimAcademicRow = {
  id: string;
  courseCode: string;
  moduleName: string;
  chiefTutor: string;
  mainDuty: string;
};

type FosAcademicRow = {
  id: string;
  courseCode: string;
  moduleName: string;
  tutorName: string;
  mainDuty: string;
};

type AdminTaskLibraryItem = {
  id: string;
  name: string;
  coordinator: string;
  description: string;
};

type AdminTaskRow = {
  id: string;
  libraryTaskId: string;
  coordinator: string;
  description: string;
};

const MAIN_DUTY_OPTIONS = [
  'PRACTICAL',
  'GRADING',
  'PREPARE TUTORIALS AND QUIZZES',
  'CONDUCT TUTORIAL CLASSES',
  'GRADING QUIZZES',
  'VL COORDINATION',
] as const;

const ADMIN_TASK_LIBRARY_KEY = 'dimAdministrativeTaskLibrary';

const DEFAULT_ADMIN_TASK_LIBRARY: AdminTaskLibraryItem[] = [
  {
    id: 'adm-lib-1',
    name: 'RECEPTION DUTIES',
    coordinator: '—',
    description: 'Perform reception duties, including handling inquiries and directing students.',
  },
  {
    id: 'adm-lib-2',
    name: 'VISITING LECTURER COORDINATION',
    coordinator: '—',
    description: 'Coordinate visiting lecturers and assist in their scheduling.',
  },
  {
    id: 'adm-lib-3',
    name: 'RECORDS & ATTENDANCE',
    coordinator: '—',
    description: 'Maintain records on attendance and student performance records.',
  },
  {
    id: 'adm-lib-4',
    name: 'DIM QUALITY ASSURANCE / ISO PROCESS',
    coordinator: 'Dr. Chathumi Kavirathna',
    description:
      'Assist with DIM quality assurance/ISO process.\n\n' +
      'Primary responsibilities:\n' +
      '• Conduct periodic internal audits and assessments to evaluate compliance with QA requirements.\n' +
      '• Oversee the implementation and maintenance of ISO standards within DIM.\n' +
      '• Maintain ISO documentation, including policies, procedures, and process records.\n' +
      '• Coordinate ISO audits and certification renewals in collaboration with relevant stakeholders.\n' +
      '• Identify areas for improvement in academic, research, and administrative workflows.\n' +
      '• Recommend and implement process optimizations to enhance efficiency and effectiveness.\n' +
      '• Monitor key performance indicators (KPIs) to ensure quality objectives are met.\n' +
      '• Prepare quality reports and audit summaries for departmental and university-level reviews.',
  },
  {
    id: 'adm-lib-5',
    name: 'INDUSTRIAL MENTORING PROGRAM',
    coordinator: 'Dr. Thilini Mahanama',
    description:
      'Assisting the Industrial Mentoring Program.\n' +
      'ISSUE NO: 01 | REV. NO: 00 | DOI: 2024-02-24\n\n' +
      'Primary responsibilities:\n' +
      '• Identify and recruit industry professionals willing to serve as mentors.\n' +
      '• Match mentors with mentees based on academic background, career interests, and industry alignment.\n' +
      '• Maintaining a mentor database.\n' +
      '• Conduct periodic check-ins to track mentees’ progress and address challenges.\n' +
      '• Develop and administer surveys or feedback mechanisms to evaluate program effectiveness and identify mentoring needs.\n' +
      '• Updating the mentoring webpage and promoting the program through DIM website and LinkedIn.',
  },
  {
    id: 'adm-lib-6',
    name: 'STUDENT FEEDBACK PROCESS',
    coordinator: 'Dr. Thilini Mahanama',
    description:
      'Assist with the student feedback process.\n\n' +
      'Midterm and End-of-Semester Student Feedback Collection:\n' +
      '• Distribute feedback forms across all levels during 4th week (midterm) and 14th/15th week (end-of-semester).\n' +
      '• Provide lecturers with the necessary feedback sheets before their sessions.\n' +
      '• Communicate with visiting lecturers about QA process and provide required resources.\n' +
      '• Ensure feedback collection covers all modules, including visiting staff lectures.\n\n' +
      'Facilitating Lecturer-Student Discussion Sessions:\n' +
      '• Organize discussion sessions with Level 1–4 students during the 6th week.\n' +
      '• Facilitate open conversations between students and lecturers.\n\n' +
      'Data Analysis and Reporting:\n' +
      '• Analyze collected feedback and compile reports.\n' +
      '• Share analyzed data with the academic adviser.\n' +
      '• Organize and store collected feedback for semester-end evaluations.\n' +
      '• Ensure feedback data is accessible for continuous improvement.',
  },
];

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const AM_PM = ['AM', 'PM'] as const;

function normalizeCode(v: string) {
  return String(v || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function loadAdminTaskLibrary(): AdminTaskLibraryItem[] {
  try {
    const raw = localStorage.getItem(ADMIN_TASK_LIBRARY_KEY);
    if (!raw) return DEFAULT_ADMIN_TASK_LIBRARY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ADMIN_TASK_LIBRARY;
    return parsed
      .map((x: any) => ({
        id: String(x?.id || ''),
        name: String(x?.name || ''),
        coordinator: String(x?.coordinator || ''),
        description: String(x?.description || ''),
      }))
      .filter((x: AdminTaskLibraryItem) => x.id && x.name);
  } catch {
    return DEFAULT_ADMIN_TASK_LIBRARY;
  }
}

function saveAdminTaskLibrary(items: AdminTaskLibraryItem[]) {
  localStorage.setItem(ADMIN_TASK_LIBRARY_KEY, JSON.stringify(items));
}

export default function JobDescriptionPage(props: {
  staffMember: {
    id: string;
    name: string;
    preferredSubjects?: string[];
    preferredModules?: string[];
    preferredModuleDetails?: Array<{
      id: string;
      code: string;
      name: string;
      chiefTutor?: string | null;
      programKind: string;
      mitTrack?: string | null;
      semesterLabel: string;
      compulsoryOptional: string;
      credits: number;
    }>;
  };
  onBack: () => void;
  onSave: (staffId: string, tasks: Task[]) => void;
}) {
  const { staffMember, onBack, onSave } = props;
  const [showEditPrimaryResponsibilities, setShowEditPrimaryResponsibilities] = useState(false);

  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [semesterEndDate, setSemesterEndDate] = useState('');

  const [curriculumModules, setCurriculumModules] = useState<CurriculumModuleDto[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [dimRows, setDimRows] = useState<DimAcademicRow[]>([
    { id: 'dim-1', courseCode: '', moduleName: '', chiefTutor: '', mainDuty: '' },
  ]);
  const [fosRows, setFosRows] = useState<FosAcademicRow[]>([
    { id: 'fos-1', courseCode: '', moduleName: '', tutorName: '', mainDuty: '' },
  ]);

  const [adminLibrary, setAdminLibrary] = useState<AdminTaskLibraryItem[]>(() => loadAdminTaskLibrary());
  const [adminRows, setAdminRows] = useState<AdminTaskRow[]>([
    { id: 'adm-1', libraryTaskId: '', coordinator: '', description: '' },
  ]);
  const [editingLibrary, setEditingLibrary] = useState(false);

  const [receptionRows, setReceptionRows] = useState<
    Array<{
      id: string;
      day: (typeof DAYS_OF_WEEK)[number];
      fromHour: string;
      fromMinute: string;
      fromAmpm: (typeof AM_PM)[number];
      toHour: string;
      toMinute: string;
      toAmpm: (typeof AM_PM)[number];
      notes: string;
    }>
  >([
    {
      id: 'rec-1',
      day: 'MONDAY',
      fromHour: '09',
      fromMinute: '00',
      fromAmpm: 'AM',
      toHour: '10',
      toMinute: '00',
      toAmpm: 'AM',
      notes: '',
    },
  ]);

  useEffect(() => {
    let mounted = true;
    setLoadingModules(true);
    getCurriculumModules({ semester: 'all', programKind: 'all' })
      .then((mods) => {
        if (!mounted) return;
        setCurriculumModules(mods || []);
      })
      .catch((e) => {
        console.error('Failed to load curriculum modules', e);
        if (!mounted) return;
        setCurriculumModules([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingModules(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const moduleByCode = useMemo(() => {
    const map = new Map<string, CurriculumModuleDto>();
    for (const m of curriculumModules) {
      map.set(normalizeCode(m.code), m);
    }
    return map;
  }, [curriculumModules]);

  const handleSave = async () => {
    if (!academicYear.trim()) {
      alert('Please enter the academic year.');
      return;
    }
    if (!semester.trim()) {
      alert('Please select the semester.');
      return;
    }
    if (!semesterStartDate || !semesterEndDate) {
      alert('Please select semester start and end dates.');
      return;
    }

    const dimFilled = dimRows.filter((r) => normalizeCode(r.courseCode) && r.mainDuty.trim());
    const fosFilled = fosRows.filter((r) => (r.moduleName.trim() || normalizeCode(r.courseCode)) && r.mainDuty.trim());
    const adminFilled = adminRows.filter((t) => (t.coordinator.trim() || t.description.trim()));
    const receptionFilled = receptionRows.filter((r) => r.notes.trim());

    if (dimFilled.length === 0 && fosFilled.length === 0 && adminFilled.length === 0 && receptionFilled.length === 0) {
      alert('Please add at least one duty/task.');
      return;
    }

    const payload = {
      academicYear: academicYear.trim(),
      semester: semester.trim(),
      semesterStartDate,
      semesterEndDate,
      primaryResponsibilities: loadPrimaryResponsibilitiesText(),
      dimAcademicTasks: dimFilled.map((r) => ({
        courseCode: normalizeCode(r.courseCode),
        moduleName: r.moduleName || '',
        chiefTutor: r.chiefTutor || '',
        mainDuty: r.mainDuty.trim(),
      })),
      fosAcademicTasks: fosFilled.map((r) => ({
        courseCode: normalizeCode(r.courseCode) || '',
        moduleName: r.moduleName.trim(),
        tutorName: r.tutorName.trim(),
        mainDuty: r.mainDuty.trim(),
      })),
      administrativeTasks: adminFilled.map((t) => {
        const selected = adminLibrary.find((x) => x.id === t.libraryTaskId);
        return {
          taskName: selected?.name || '',
          coordinator: t.coordinator.trim() || '',
          description: t.description || '',
        };
      }),
      receptionTasks: receptionFilled.map((r) => ({
        day: r.day,
        fromHour: r.fromHour,
        fromMinute: r.fromMinute,
        fromAmpm: r.fromAmpm,
        toHour: r.toHour,
        toMinute: r.toMinute,
        toAmpm: r.toAmpm,
        notes: r.notes.trim(),
      })),
    };

    try {
      await upsertJobDescriptionForStaff(staffMember.id, JSON.stringify(payload));
      // Keep old callback for existing UI state updates (e.g. hasJobDescription)
      onSave(staffMember.id, []);
    } catch (e: any) {
      alert(`Save failed: ${e?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-[#e0e0e0] text-[#555555]"
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            Create Job Description
          </h2>
          <Badge className="bg-[#4db4ac] text-white">FR12</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
            onClick={() => setShowEditPrimaryResponsibilities(true)}
          >
            Edit Primary Responsibilities
          </Button>
          <Button variant="outline" className="border-[#d0d0d0] text-[#555555]" onClick={onBack}>
            Cancel
          </Button>
          <Button className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white" onClick={handleSave}>
            Save Job Description
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
        <p className="text-[#555555]" style={{ fontSize: '14px' }}>
          Define the academic and administrative tasks for the staff member.
        </p>

        <div className="mt-5 space-y-6">
          <div className="bg-[#f9f9f9] p-4 rounded-lg">
            <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Staff Member: {staffMember.name}
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Academic year
                </Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g., 2026/2027"
                  className="border-[#e0e0e0] bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Semester
                </Label>
                <Input
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g., 1 or 2"
                  className="border-[#e0e0e0] bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Semester start date
                </Label>
                <Input
                  type="date"
                  value={semesterStartDate}
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                  className="border-[#e0e0e0] bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Semester end date
                </Label>
                <Input
                  type="date"
                  value={semesterEndDate}
                  onChange={(e) => setSemesterEndDate(e.target.value)}
                  className="border-[#e0e0e0] bg-white"
                />
              </div>
            </div>

            {staffMember.preferredSubjects && staffMember.preferredSubjects.length > 0 && (
              <div className="mt-3">
                <p className="text-[#555555] mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Preferred Subjects:
                </p>
                <div className="flex flex-wrap gap-1">
                  {staffMember.preferredSubjects.map((subject, idx) => (
                    <Badge key={idx} className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]" style={{ fontSize: '11px' }}>
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              <p className="text-[#555555] mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>
                Preferred Modules Received:
              </p>
              {staffMember.preferredModuleDetails && staffMember.preferredModuleDetails.length > 0 ? (
                <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#f5f5f5] text-[#222222]">
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Module code</th>
                        <th className="px-3 py-2 text-left font-semibold min-w-[240px]">Name</th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Chief tutor</th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Programme</th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Semester</th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">C/O</th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Cr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffMember.preferredModuleDetails.map((m, idx) => (
                        <tr key={m.id || `${m.code}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                          <td className="px-3 py-2 font-medium text-[#222222] whitespace-nowrap">{m.code}</td>
                          <td className="px-3 py-2 text-[#333333]">{m.name}</td>
                          <td className="px-3 py-2 text-[#555555] whitespace-nowrap">
                            {m.chiefTutor && String(m.chiefTutor).trim() ? m.chiefTutor : '—'}
                          </td>
                          <td className="px-3 py-2 text-[#555555] whitespace-nowrap">
                            {m.programKind === 'ALL' ? 'MIT/IT' : m.programKind}
                            {m.programKind === 'MIT' && m.mitTrack ? ` (${m.mitTrack})` : ''}
                          </td>
                          <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{m.semesterLabel}</td>
                          <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{m.compulsoryOptional}</td>
                          <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{m.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : staffMember.preferredModules && staffMember.preferredModules.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {staffMember.preferredModules.map((code, idx) => (
                    <Badge key={idx} className="bg-[#4db4ac] text-white border-0" style={{ fontSize: '11px' }}>
                      {code}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                  —
                </p>
              )}
            </div>
          </div>

          <Separator />

          <datalist id="main-duty-options">
            {MAIN_DUTY_OPTIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>

          {/* DIM Academic Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#4db4ac]" />
                <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                  DIM Academic Tasks
                </Label>
              </div>
              <Button
                type="button"
                onClick={() =>
                  setDimRows((prev) => [
                    ...prev,
                    { id: `dim-${Date.now()}`, courseCode: '', moduleName: '', chiefTutor: '', mainDuty: '' },
                  ])
                }
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                style={{ fontSize: '12px' }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add DIM task
              </Button>
            </div>

            {loadingModules && (
              <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                Loading module details…
              </p>
            )}

            <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f5f5f5] text-[#222222]">
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Course code</th>
                    <th className="px-3 py-2 text-left font-semibold min-w-[220px]">Module name</th>
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Chief tutor</th>
                    <th className="px-3 py-2 text-left font-semibold min-w-[260px]">Main duty</th>
                    <th className="px-3 py-2 text-left font-semibold w-[72px]"> </th>
                  </tr>
                </thead>
                <tbody>
                  {dimRows.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                      <td className="px-3 py-2">
                        <Input
                          value={r.courseCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            const m = moduleByCode.get(normalizeCode(code));
                            setDimRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? {
                                      ...x,
                                      courseCode: code,
                                      moduleName: m?.name ?? '',
                                      chiefTutor: m?.chiefTutor ?? '',
                                    }
                                  : x
                              )
                            );
                          }}
                          placeholder="e.g., DELT 11232"
                          className="border-[#e0e0e0] bg-white"
                        />
                      </td>
                      <td className="px-3 py-2 text-[#333333]">{r.moduleName || '—'}</td>
                      <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{r.chiefTutor || '—'}</td>
                      <td className="px-3 py-2">
                        <Input
                          list="main-duty-options"
                          value={r.mainDuty}
                          onChange={(e) =>
                            setDimRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, mainDuty: e.target.value } : x)))
                          }
                          placeholder="Select or type a duty"
                          className="border-[#e0e0e0] bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setDimRows((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== r.id) : prev))
                          }
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                          disabled={dimRows.length === 1}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* FOS Academic Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#4db4ac]" />
                <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                  FOS Academic Tasks
                </Label>
              </div>
              <Button
                type="button"
                onClick={() =>
                  setFosRows((prev) => [
                    ...prev,
                    { id: `fos-${Date.now()}`, courseCode: '', moduleName: '', tutorName: '', mainDuty: '' },
                  ])
                }
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                style={{ fontSize: '12px' }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add FOS task
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f5f5f5] text-[#222222]">
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Course code</th>
                    <th className="px-3 py-2 text-left font-semibold min-w-[220px]">Module name</th>
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Tutor</th>
                    <th className="px-3 py-2 text-left font-semibold min-w-[260px]">Main duty</th>
                    <th className="px-3 py-2 text-left font-semibold w-[72px]"> </th>
                  </tr>
                </thead>
                <tbody>
                  {fosRows.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                      <td className="px-3 py-2">
                        <Input
                          value={r.courseCode}
                          onChange={(e) =>
                            setFosRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, courseCode: e.target.value } : x)))
                          }
                          placeholder="(optional)"
                          className="border-[#e0e0e0] bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={r.moduleName}
                          onChange={(e) =>
                            setFosRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, moduleName: e.target.value } : x)))
                          }
                          placeholder="Type module name"
                          className="border-[#e0e0e0] bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={r.tutorName}
                          onChange={(e) =>
                            setFosRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, tutorName: e.target.value } : x)))
                          }
                          placeholder="Type tutor name"
                          className="border-[#e0e0e0] bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          list="main-duty-options"
                          value={r.mainDuty}
                          onChange={(e) =>
                            setFosRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, mainDuty: e.target.value } : x)))
                          }
                          placeholder="Select or type a duty"
                          className="border-[#e0e0e0] bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setFosRows((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== r.id) : prev))
                          }
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                          disabled={fosRows.length === 1}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Administrative Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#4db4ac]" />
                <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                  Administrative Tasks
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                  onClick={() => setEditingLibrary(true)}
                  style={{ fontSize: '12px' }}
                >
                  Manage Admin Tasks
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    setAdminRows((prev) => [
                      ...prev,
                      {
                        id: `adm-${Date.now()}`,
                        libraryTaskId: '',
                        coordinator: '',
                        description: '',
                      },
                    ])
                  }
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                  style={{ fontSize: '12px' }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Administrative Task
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {adminRows.map((row) => (
                <div key={row.id} className="bg-[#fff8e6] p-3 rounded-lg border border-[#f59e0b]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <div className="space-y-1">
                      <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                        Task (select)
                      </Label>
                      <select
                        value={row.libraryTaskId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const item = adminLibrary.find((x) => x.id === id);
                          setAdminRows((prev) =>
                            prev.map((x) =>
                              x.id === row.id
                                ? {
                                    ...x,
                                    libraryTaskId: id,
                                    coordinator: item?.coordinator ?? x.coordinator,
                                    description: item?.description ?? x.description,
                                  }
                                : x
                            )
                          );
                        }}
                        className="w-full rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                      >
                        <option value="">— Select an administrative task —</option>
                        {adminLibrary.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                        Coordinator
                      </Label>
                      <Input
                        value={row.coordinator}
                        onChange={(e) =>
                          setAdminRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, coordinator: e.target.value } : x)))
                        }
                        placeholder="Coordinator name"
                        className="border-[#e0e0e0] bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                        Description
                      </Label>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={row.description}
                          onChange={(e) =>
                            setAdminRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, description: e.target.value } : x)))
                          }
                          placeholder="Task description (paragraph)"
                          className="border-[#e0e0e0] bg-white min-h-[92px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                          title="Save changes to library"
                          onClick={() => {
                            if (!row.libraryTaskId) {
                              alert('Select a task first (or add a new one in Manage Admin Tasks).');
                              return;
                            }
                            setAdminLibrary((prev) => {
                              const next = prev.map((t) =>
                                t.id === row.libraryTaskId
                                  ? { ...t, coordinator: row.coordinator, description: row.description }
                                  : t
                              );
                              saveAdminTaskLibrary(next);
                              return next;
                            });
                            alert('Saved to Admin Tasks library.');
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0 flex-shrink-0"
                          onClick={() => setAdminRows((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== row.id) : prev))}
                          disabled={adminRows.length === 1}
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {adminRows.length === 0 && (
                <p className="text-[#999999] text-center py-4" style={{ fontSize: '13px' }}>
                  No administrative tasks added yet
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Reception Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#4db4ac]" />
                <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                  Reception Tasks
                </Label>
              </div>
              <Button
                type="button"
                onClick={() =>
                  setReceptionRows((prev) => [
                    ...prev,
                    {
                      id: `rec-${Date.now()}`,
                      day: 'MONDAY',
                      fromHour: '09',
                      fromMinute: '00',
                      fromAmpm: 'AM',
                      toHour: '10',
                      toMinute: '00',
                      toAmpm: 'AM',
                      notes: '',
                    },
                  ])
                }
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                style={{ fontSize: '12px' }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Reception Task
              </Button>
            </div>

            <div className="space-y-3">
              {receptionRows.map((r) => (
                <div key={r.id} className="bg-white rounded-lg border border-[#e0e0e0] p-3">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                        Day
                      </Label>
                      <select
                        value={r.day}
                        onChange={(e) =>
                          setReceptionRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, day: e.target.value as any } : x)))
                        }
                        className="w-full rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                        Time (From → To)
                      </Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                          From
                        </span>
                        <select
                          value={r.fromHour}
                          onChange={(e) =>
                            setReceptionRows((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, fromHour: e.target.value } : x))
                            )
                          }
                          className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <select
                          value={r.fromMinute}
                          onChange={(e) =>
                            setReceptionRows((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, fromMinute: e.target.value } : x))
                            )
                          }
                          className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                        >
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={r.fromAmpm}
                          onChange={(e) =>
                            setReceptionRows((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, fromAmpm: e.target.value as any } : x))
                            )
                          }
                          className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                        >
                          {AM_PM.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <span className="text-[#999999] px-1" style={{ fontSize: '14px', fontWeight: 700 }}>
                          →
                        </span>
                        <span className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                          To
                        </span>
                        <select
                          value={r.toHour}
                          onChange={(e) =>
                            setReceptionRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, toHour: e.target.value } : x)))
                          }
                          className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <select
                          value={r.toMinute}
                          onChange={(e) =>
                            setReceptionRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, toMinute: e.target.value } : x)))
                          }
                          className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                        >
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={r.toAmpm}
                          onChange={(e) =>
                            setReceptionRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, toAmpm: e.target.value as any } : x)))
                          }
                          className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
                        >
                          {AM_PM.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                        Notes
                      </Label>
                      <Input
                        value={r.notes}
                        onChange={(e) =>
                          setReceptionRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, notes: e.target.value } : x)))
                        }
                        placeholder="Optional notes"
                        className="border-[#e0e0e0] bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                      onClick={() => setReceptionRows((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== r.id) : prev))}
                      disabled={receptionRows.length === 1}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {editingLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-lg border border-[#e0e0e0] p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
                  Administrative Tasks Library
                </h3>
                <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                  Add/edit tasks (Coordinator + Description) and save for future use.
                </p>
              </div>
              <Button variant="outline" onClick={() => setEditingLibrary(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {adminLibrary.map((t) => (
                <div key={t.id} className="rounded-lg border border-[#e0e0e0] p-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      value={t.name}
                      onChange={(e) =>
                        setAdminLibrary((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value.toUpperCase() } : x))
                        )
                      }
                      placeholder="TASK NAME"
                      className="border-[#e0e0e0]"
                    />
                    <Input
                      value={t.coordinator}
                      onChange={(e) =>
                        setAdminLibrary((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, coordinator: e.target.value } : x))
                        )
                      }
                      placeholder="Coordinator"
                      className="border-[#e0e0e0]"
                    />
                    <Textarea
                      value={t.description}
                      onChange={(e) =>
                        setAdminLibrary((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, description: e.target.value } : x))
                        )
                      }
                      placeholder="Description (paragraph)"
                      className="border-[#e0e0e0] min-h-[92px] md:col-span-2"
                    />
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => setAdminLibrary((prev) => prev.filter((x) => x.id !== t.id))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                  onClick={() =>
                    setAdminLibrary((prev) => [
                      ...prev,
                      { id: `adm-lib-${Date.now()}`, name: 'NEW TASK', coordinator: '', description: '' },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add new task
                </Button>
                <Button
                  type="button"
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                  onClick={() => {
                    const cleaned = adminLibrary
                      .map((x) => ({ ...x, name: String(x.name || '').trim() }))
                      .filter((x) => x.name);
                    setAdminLibrary(cleaned);
                    saveAdminTaskLibrary(cleaned);
                    alert('Administrative tasks library saved.');
                  }}
                >
                  Save Library
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditPrimaryResponsibilitiesDialog
        open={showEditPrimaryResponsibilities}
        onOpenChange={setShowEditPrimaryResponsibilities}
      />
    </div>
  );
}

