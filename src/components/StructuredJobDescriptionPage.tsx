import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ChevronLeft } from 'lucide-react';

function formatReceptionTime(t: any) {
  const day = t?.day || '';
  const hh = t?.hour || '';
  const mm = t?.minute || '';
  const ap = t?.ampm || '';
  const time = hh && mm ? `${hh}:${mm}` : '';
  return [day, [time, ap].filter(Boolean).join(' ')].filter(Boolean).join(' ');
}

export default function StructuredJobDescriptionPage(props: {
  staffName: string;
  jd: any | null;
  loading?: boolean;
  onBack: () => void;
}) {
  const { staffName, jd, loading, onBack } = props;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-[#e0e0e0] text-[#555555]" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
            Job Description
          </h2>
          <Badge className="bg-[#4db4ac] text-white">JD</Badge>
        </div>
        <div className="text-[#555555]" style={{ fontSize: '13px' }}>
          {staffName}
        </div>
      </div>

      <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
        {loading ? (
          <div className="text-center py-10 text-[#4db4ac]" style={{ fontSize: '14px' }}>
            Loading job description…
          </div>
        ) : !jd ? (
          <div className="text-center py-10 text-[#999999]" style={{ fontSize: '14px' }}>
            No job description found.
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                Academic Year
              </p>
              <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                {jd.academicYear || '—'}
              </p>
            </Card>

            <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                Semester
              </p>
              <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                {jd.semester || '—'}
              </p>
            </Card>

            <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                Semester Start Date
              </p>
              <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                {jd.semesterStartDate || '—'}
              </p>
            </Card>

            <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                Semester End Date
              </p>
              <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                {jd.semesterEndDate || '—'}
              </p>
            </Card>

            <Separator />

            <div>
              <p className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                Primary Responsibilities
              </p>
              <Card className="bg-white border border-[#e0e0e0] p-4">
                <pre className="whitespace-pre-wrap text-[#222222]" style={{ fontSize: '13px', lineHeight: '1.7', fontFamily: 'inherit' }}>
                  {jd.primaryResponsibilities || '—'}
                </pre>
              </Card>
            </div>

            <Separator />

            <div>
              <p className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                DIM Academic Tasks
              </p>
              <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#222222]">
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Course code</th>
                      <th className="px-3 py-2 text-left font-semibold min-w-[240px]">Module name</th>
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Chief tutor</th>
                      <th className="px-3 py-2 text-left font-semibold min-w-[220px]">Main duty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(jd.dimAcademicTasks || []).map((t: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                        <td className="px-3 py-2 font-medium text-[#222222] whitespace-nowrap">{t.courseCode || '—'}</td>
                        <td className="px-3 py-2 text-[#333333]">{t.moduleName || '—'}</td>
                        <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{t.chiefTutor || '—'}</td>
                        <td className="px-3 py-2 text-[#555555]">{t.mainDuty || '—'}</td>
                      </tr>
                    ))}
                    {(!jd.dimAcademicTasks || jd.dimAcademicTasks.length === 0) && (
                      <tr>
                        <td className="px-3 py-3 text-[#999999]" colSpan={4}>
                          —
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                FOS Academic Tasks
              </p>
              <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#222222]">
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Course code</th>
                      <th className="px-3 py-2 text-left font-semibold min-w-[240px]">Module name</th>
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Tutor</th>
                      <th className="px-3 py-2 text-left font-semibold min-w-[220px]">Main duty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(jd.fosAcademicTasks || []).map((t: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                        <td className="px-3 py-2 font-medium text-[#222222] whitespace-nowrap">{t.courseCode || '—'}</td>
                        <td className="px-3 py-2 text-[#333333]">{t.moduleName || '—'}</td>
                        <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{t.tutorName || '—'}</td>
                        <td className="px-3 py-2 text-[#555555]">{t.mainDuty || '—'}</td>
                      </tr>
                    ))}
                    {(!jd.fosAcademicTasks || jd.fosAcademicTasks.length === 0) && (
                      <tr>
                        <td className="px-3 py-3 text-[#999999]" colSpan={4}>
                          —
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                Administrative Tasks Assigned
              </p>
              <div className="space-y-2">
                {(jd.administrativeTasks || []).map((t: any, idx: number) => (
                  <Card key={idx} className="bg-white border border-[#e0e0e0] p-4">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {t.taskName || 'Administrative task'}
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Coordinator: {t.coordinator || '—'}
                    </p>
                    <pre className="whitespace-pre-wrap text-[#333333] mt-2" style={{ fontSize: '13px', lineHeight: '1.7', fontFamily: 'inherit' }}>
                      {t.description || '—'}
                    </pre>
                  </Card>
                ))}
                {(!jd.administrativeTasks || jd.administrativeTasks.length === 0) && (
                  <p className="text-[#999999]" style={{ fontSize: '13px' }}>
                    —
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                Reception Task
              </p>
              <div className="space-y-2">
                {(jd.receptionTasks || []).map((t: any, idx: number) => (
                  <Card key={idx} className="bg-white border border-[#e0e0e0] p-4">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {formatReceptionTime(t) || '—'}
                    </p>
                    <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                      {t.notes || '—'}
                    </p>
                  </Card>
                ))}
                {(!jd.receptionTasks || jd.receptionTasks.length === 0) && (
                  <p className="text-[#999999]" style={{ fontSize: '13px' }}>
                    —
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

