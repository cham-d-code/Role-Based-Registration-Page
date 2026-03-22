import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BookOpen, Briefcase, User } from 'lucide-react';
import { Card } from './ui/card';

interface Task {
  id: string;
  description: string;
  type: 'academic' | 'administrative';
}

interface JobDescription {
  staffId: string;
  staffName: string;
  tasks: Task[];
  createdDate: string;
  createdBy: string;
}

interface ViewJobDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDescription: JobDescription | null;
}

export default function ViewJobDescriptionDialog({ 
  open, 
  onOpenChange, 
  jobDescription 
}: ViewJobDescriptionDialogProps) {
  if (!jobDescription) return null;

  const academicTasks = jobDescription.tasks.filter(t => t.type === 'academic');
  const administrativeTasks = jobDescription.tasks.filter(t => t.type === 'administrative');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            Job Description
            <Badge className="bg-[#4db4ac] text-white">FR13/FR14</Badge>
          </DialogTitle>
          <DialogDescription className="text-[#555555]">View the job description for {jobDescription.staffName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Info */}
          <div className="bg-[#e6f7f6] border border-[#4db4ac] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-[#4db4ac]" />
              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                {jobDescription.staffName}
              </h4>
            </div>
            <div className="text-[#555555]" style={{ fontSize: '13px' }}>
              <p>Created by: {jobDescription.createdBy}</p>
              <p>Date: {jobDescription.createdDate}</p>
            </div>
          </div>

          <Separator />

          {/* Academic Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-[#4db4ac]" />
              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                Academic Tasks ({academicTasks.length})
              </h4>
            </div>
            
            {academicTasks.length > 0 ? (
              <div className="space-y-2">
                {academicTasks.map((task, index) => (
                  <Card key={task.id} className="bg-[#e6f7f6] border border-[#4db4ac] p-3">
                    <p className="text-[#222222]" style={{ fontSize: '14px' }}>
                      {index + 1}. {task.description}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-[#999999]" style={{ fontSize: '13px' }}>No academic tasks assigned</p>
            )}
          </div>

          <Separator />

          {/* Administrative Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-5 w-5 text-[#4db4ac]" />
              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                Administrative Tasks ({administrativeTasks.length})
              </h4>
            </div>
            
            {administrativeTasks.length > 0 ? (
              <div className="space-y-2">
                {administrativeTasks.map((task, index) => (
                  <Card key={task.id} className="bg-[#fff8e6] border border-[#f59e0b] p-3">
                    <p className="text-[#222222]" style={{ fontSize: '14px' }}>
                      {index + 1}. {task.description}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-[#999999]" style={{ fontSize: '13px' }}>No administrative tasks assigned</p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-[#f9f9f9] rounded-lg p-4">
            <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Total Tasks: {jobDescription.tasks.length}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#4db4ac]" />
                <span className="text-[#555555]" style={{ fontSize: '13px' }}>
                  {academicTasks.length} Academic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#4db4ac]" />
                <span className="text-[#555555]" style={{ fontSize: '13px' }}>
                  {administrativeTasks.length} Administrative
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}