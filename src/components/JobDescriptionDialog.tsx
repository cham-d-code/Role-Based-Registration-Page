import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Trash2, BookOpen, Briefcase } from 'lucide-react';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';

interface Task {
  id: string;
  description: string;
  type: 'academic' | 'administrative';
}

interface JobDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: { id: string; name: string; preferredSubjects?: string[] } | null;
  onSave: (staffId: string, tasks: Task[]) => void;
}

export default function JobDescriptionDialog({ 
  open, 
  onOpenChange, 
  staffMember,
  onSave 
}: JobDescriptionDialogProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', description: '', type: 'academic' }
  ]);

  const addTask = (type: 'academic' | 'administrative') => {
    setTasks([...tasks, { 
      id: Date.now().toString(), 
      description: '', 
      type 
    }]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateTask = (id: string, description: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, description } : t
    ));
  };

  const handleSave = () => {
    const filledTasks = tasks.filter(t => t.description.trim());
    if (filledTasks.length === 0) {
      alert('Please add at least one task!');
      return;
    }
    if (staffMember) {
      onSave(staffMember.id, filledTasks);
      setTasks([{ id: '1', description: '', type: 'academic' }]);
      onOpenChange(false);
    }
  };

  const academicTasks = tasks.filter(t => t.type === 'academic');
  const administrativeTasks = tasks.filter(t => t.type === 'administrative');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            Create Job Description
            <Badge className="bg-[#4db4ac] text-white">FR12</Badge>
          </DialogTitle>
          <DialogDescription className="text-[#555555]">
            Define the academic and administrative tasks for the staff member.
          </DialogDescription>
        </DialogHeader>

        {staffMember && (
          <div className="space-y-6">
            {/* Staff Member Info */}
            <div className="bg-[#f9f9f9] p-4 rounded-lg">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                Staff Member: {staffMember.name}
              </p>
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
            </div>

            <Separator />

            {/* Academic Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#4db4ac]" />
                  <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Academic Tasks
                  </Label>
                </div>
                <Button
                  type="button"
                  onClick={() => addTask('academic')}
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                  style={{ fontSize: '12px' }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Academic Task
                </Button>
              </div>

              <div className="space-y-3">
                {academicTasks.map((task, index) => (
                  <div key={task.id} className="flex gap-3 items-start bg-[#e6f7f6] p-3 rounded-lg">
                    <div className="flex-1">
                      <Input
                        value={task.description}
                        onChange={(e) => updateTask(task.id, e.target.value)}
                        placeholder="e.g., Conduct tutorial sessions for Marketing Management"
                        className="border-[#d0d0d0] focus:border-[#4db4ac] bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0 flex-shrink-0"
                      disabled={tasks.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {academicTasks.length === 0 && (
                  <p className="text-[#999999] text-center py-4" style={{ fontSize: '13px' }}>
                    No academic tasks added yet
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Administrative Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#4db4ac]" />
                  <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Administrative Tasks
                  </Label>
                </div>
                <Button
                  type="button"
                  onClick={() => addTask('administrative')}
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white px-3 py-1 h-auto"
                  style={{ fontSize: '12px' }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Administrative Task
                </Button>
              </div>

              <div className="space-y-3">
                {administrativeTasks.map((task, index) => (
                  <div key={task.id} className="flex gap-3 items-start bg-[#fff8e6] p-3 rounded-lg">
                    <div className="flex-1">
                      <Input
                        value={task.description}
                        onChange={(e) => updateTask(task.id, e.target.value)}
                        placeholder="e.g., Assist with student registration and documentation"
                        className="border-[#d0d0d0] focus:border-[#4db4ac] bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {administrativeTasks.length === 0 && (
                  <p className="text-[#999999] text-center py-4" style={{ fontSize: '13px' }}>
                    No administrative tasks added yet
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#f9f9f9] p-4 rounded-lg">
              <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                Summary
              </p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#4db4ac]" />
                  <span className="text-[#555555]" style={{ fontSize: '13px' }}>
                    {academicTasks.filter(t => t.description).length} Academic Task(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#4db4ac]" />
                  <span className="text-[#555555]" style={{ fontSize: '13px' }}>
                    {administrativeTasks.filter(t => t.description).length} Administrative Task(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#d0d0d0] text-[#555555]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
          >
            Save Job Description
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}