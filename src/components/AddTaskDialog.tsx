import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, Calendar, FileText, BookOpen, Briefcase } from 'lucide-react';
import { Badge } from './ui/badge';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: {
    title: string;
    category: string;
    day: string;
    timeFrom: string;
    timeTo: string;
    status: string;
  }) => void;
}

export default function AddTaskDialog({ open, onOpenChange, onSubmit }: AddTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    day: '',
    timeFrom: '',
    timeTo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.day || !formData.timeFrom || !formData.timeTo) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit({
      ...formData,
      status: 'Pending'
    });

    // Reset form
    setFormData({
      title: '',
      category: 'Academic',
      day: '',
      timeFrom: '',
      timeTo: '',
    });
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      category: 'Academic',
      day: '',
      timeFrom: '',
      timeTo: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontSize: '22px', fontWeight: 700 }}>
            Add New Task
          </DialogTitle>
          <DialogDescription className="text-[#555555]" style={{ fontSize: '14px' }}>
            Create a new task for your weekly schedule
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[#222222] flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
              <FileText className="h-4 w-4 text-[#4db4ac]" />
              Task Title *
            </Label>
            <Textarea
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Conduct Tutorial - Marketing Management"
              className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg min-h-[60px]"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Task Category *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'Academic' })}
                className={`h-auto py-4 px-4 flex flex-col items-center gap-2 border-2 rounded-lg transition-all ${
                  formData.category === 'Academic'
                    ? 'bg-[#e6f7f6] border-[#4db4ac] text-[#4db4ac]'
                    : 'bg-white border-[#e0e0e0] text-[#555555] hover:border-[#4db4ac]'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Academic</span>
                <span style={{ fontSize: '11px', fontWeight: 400 }} className="text-[#999999]">
                  Teaching, Tutorials, Research
                </span>
              </Button>

              <Button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'Administrative' })}
                className={`h-auto py-4 px-4 flex flex-col items-center gap-2 border-2 rounded-lg transition-all ${
                  formData.category === 'Administrative'
                    ? 'bg-[#fff8e6] border-[#f59e0b] text-[#f59e0b]'
                    : 'bg-white border-[#e0e0e0] text-[#555555] hover:border-[#f59e0b]'
                }`}
              >
                <Briefcase className="h-5 w-5" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Administrative</span>
                <span style={{ fontSize: '11px', fontWeight: 400 }} className="text-[#999999]">
                  Meetings, Documentation
                </span>
              </Button>
            </div>
          </div>

          {/* Day */}
          <div className="space-y-2">
            <Label htmlFor="day" className="text-[#222222] flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
              <Calendar className="h-4 w-4 text-[#4db4ac]" />
              Day *
            </Label>
            <Select
              value={formData.day}
              onValueChange={(value) => setFormData({ ...formData, day: value })}
            >
              <SelectTrigger className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time From - To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeFrom" className="text-[#222222] flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                <Clock className="h-4 w-4 text-[#4db4ac]" />
                Time From *
              </Label>
              <Input
                id="timeFrom"
                type="time"
                value={formData.timeFrom}
                onChange={(e) => setFormData({ ...formData, timeFrom: e.target.value })}
                className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeTo" className="text-[#222222] flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                <Clock className="h-4 w-4 text-[#4db4ac]" />
                Time To *
              </Label>
              <Input
                id="timeTo"
                type="time"
                value={formData.timeTo}
                onChange={(e) => setFormData({ ...formData, timeTo: e.target.value })}
                className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e0e0e0]">
            <Button
              type="button"
              onClick={handleCancel}
              className="bg-white border-2 border-[#e0e0e0] text-[#555555] hover:bg-[#f5f5f5] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
            >
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
