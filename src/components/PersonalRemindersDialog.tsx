import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Task' | 'Meeting' | 'Deadline' | 'Personal';
  completed: boolean;
}

interface PersonalRemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PersonalRemindersDialog({ 
  open, 
  onOpenChange 
}: PersonalRemindersDialogProps) {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 'R001',
      title: 'Submit lecture materials',
      description: 'Prepare and submit week 8 lecture materials for Marketing module',
      dueDate: '2025-10-23',
      priority: 'High',
      type: 'Task',
      completed: false
    },
    {
      id: 'R002',
      title: 'Meeting with mentor',
      description: 'Monthly check-in with Dr. K. Fernando',
      dueDate: '2025-10-25',
      priority: 'Medium',
      type: 'Meeting',
      completed: false
    },
    {
      id: 'R003',
      title: 'Grade assignments',
      description: 'Complete grading for Operations Management assignment 2',
      dueDate: '2025-10-28',
      priority: 'High',
      type: 'Deadline',
      completed: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    type: 'Task' as 'Task' | 'Meeting' | 'Deadline' | 'Personal'
  });

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.dueDate) {
      toast.error('Please fill in title and due date');
      return;
    }

    const reminder: Reminder = {
      id: `R${String(reminders.length + 1).padStart(3, '0')}`,
      ...newReminder,
      completed: false
    };

    setReminders([...reminders, reminder]);
    setNewReminder({
      title: '',
      description: '',
      dueDate: '',
      priority: 'Medium',
      type: 'Task'
    });
    setShowAddForm(false);
    toast.success('Reminder created successfully. You will receive notifications before the due date.');
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    toast.success('Reminder deleted');
  };

  const handleToggleComplete = (id: string) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Meeting':
        return '👥';
      case 'Deadline':
        return '⏰';
      case 'Personal':
        return '📝';
      default:
        return '✓';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date('2025-10-20'); // Using current context date
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#4db4ac]" />
                Personal Reminders & Tasks
              </DialogTitle>
              <DialogDescription>
                Create optional reminders and receive notifications for upcoming tasks
              </DialogDescription>
            </div>
            <Badge className="bg-[#4db4ac] text-white">FR23</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Reminder Button */}
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-[#4db4ac] hover:bg-[#3da39b] text-white rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Reminder
            </Button>
          )}

          {/* Add Reminder Form */}
          {showAddForm && (
            <div className="border border-[#4db4ac] rounded-lg p-4 bg-[#e6f7f6]">
              <h3 className="text-[#333333] mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>
                Create New Reminder
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                    Title *
                  </label>
                  <Input
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="Enter reminder title"
                    className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                    Description
                  </label>
                  <Textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    placeholder="Add details (optional)"
                    className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                      Due Date *
                    </label>
                    <Input
                      type="date"
                      value={newReminder.dueDate}
                      onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                      className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                      Priority
                    </label>
                    <Select 
                      value={newReminder.priority} 
                      onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                        setNewReminder({ ...newReminder, priority: value })
                      }
                    >
                      <SelectTrigger className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[#333333] block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                      Type
                    </label>
                    <Select 
                      value={newReminder.type} 
                      onValueChange={(value: 'Task' | 'Meeting' | 'Deadline' | 'Personal') => 
                        setNewReminder({ ...newReminder, type: value })
                      }
                    >
                      <SelectTrigger className="border-[#cccccc] hover:border-[#4db4ac] focus:border-[#4db4ac] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Deadline">Deadline</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddReminder}
                    className="flex-1 bg-[#4db4ac] hover:bg-[#3da39b] text-white rounded-lg"
                  >
                    Create Reminder
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                    className="flex-1 border-[#cccccc] hover:border-[#4db4ac] rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reminders List */}
          <div className="space-y-2">
            {sortedReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`border rounded-lg p-3 ${
                  reminder.completed 
                    ? 'border-[#e0e0e0] bg-[#f9f9f9] opacity-60' 
                    : 'border-[#e0e0e0] bg-white hover:border-[#4db4ac]'
                } transition-all`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => handleToggleComplete(reminder.id)}
                    className="mt-1 h-4 w-4 rounded border-[#cccccc] text-[#4db4ac] focus:ring-[#4db4ac] cursor-pointer"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-[#333333] ${reminder.completed ? 'line-through' : ''}`} 
                          style={{ fontSize: '14px', fontWeight: 600 }}>
                        {getTypeIcon(reminder.type)} {reminder.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getPriorityColor(reminder.priority)}>
                          {reminder.priority}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {reminder.description && (
                      <p className="text-[#666666] mb-2" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                        {reminder.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-[#999999]" style={{ fontSize: '11px' }}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(reminder.dueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getDaysUntilDue(reminder.dueDate)}
                      </div>
                      <Badge variant="outline" className="text-[#999999] border-[#cccccc]" style={{ fontSize: '10px' }}>
                        {reminder.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="text-center py-12 text-[#999999]">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p style={{ fontSize: '14px' }}>No reminders yet. Create your first reminder!</p>
              </div>
            )}
          </div>

          {/* Notification Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-700" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Automatic Notifications Enabled
                </p>
                <p className="text-blue-600" style={{ fontSize: '11px', lineHeight: '1.5', marginTop: '4px' }}>
                  The system will automatically send you reminder notifications 1 day before the due date and on the due date 
                  for all pending tasks and reminders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
