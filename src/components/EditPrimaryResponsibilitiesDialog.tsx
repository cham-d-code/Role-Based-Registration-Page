import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export const PRIMARY_RESPONSIBILITIES_STORAGE_KEY = 'dimPrimaryResponsibilitiesText';

export const DEFAULT_DIM_PRIMARY_RESPONSIBILITIES = `Primary responsibilities:
• Conduct tutorial sessions, discussion classes, practical or lab sessions
• Assist in the preparation and grading of assignments, quizzes, and examinations
• Maintain records on tutorial discussions, attendance, and student performance records
• Actively and constructively participate in departmental meetings, training sessions, and knowledge transfer sessions
• Coordinate visiting lecturers and assist in their scheduling
• Perform reception duties, including handling inquiries and directing students
• Meet with the assigned mentor during the first week of the semester and provide progress updates monthly.

Note: This description outlines the primary responsibilities and expectations of tutors in DIM. Duties may be adjusted to align with evolving academic and administrative needs.`;

export function loadPrimaryResponsibilitiesText(): string {
  const v = localStorage.getItem(PRIMARY_RESPONSIBILITIES_STORAGE_KEY);
  if (v && v.trim()) return v;
  return DEFAULT_DIM_PRIMARY_RESPONSIBILITIES;
}

export function savePrimaryResponsibilitiesText(text: string) {
  localStorage.setItem(PRIMARY_RESPONSIBILITIES_STORAGE_KEY, text);
}

export default function EditPrimaryResponsibilitiesDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { open, onOpenChange } = props;
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue(loadPrimaryResponsibilitiesText());
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
            Edit DIM Primary Responsibilities
          </DialogTitle>
          <DialogDescription className="text-[#555555]">
            This text is shown to staff under “View Job Description”.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-[260px]"
          placeholder="Enter primary responsibilities…"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
            onClick={() => {
              const next = value.trim();
              if (!next) {
                alert('Text cannot be empty.');
                return;
              }
              savePrimaryResponsibilitiesText(next);
              onOpenChange(false);
              alert('Primary responsibilities updated.');
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

