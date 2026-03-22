import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell, Send } from 'lucide-react';
import { Separator } from './ui/separator';

interface SendNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (noticeData: any) => void;
}

export default function SendNoticeDialog({ 
  open, 
  onOpenChange, 
  onSend 
}: SendNoticeDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'urgent' | 'deadline',
    recipients: [] as string[]
  });

  const recipientGroups = [
    { id: 'all', label: 'All Users', description: 'Send to everyone in the system' },
    { id: 'hod', label: 'Head of Department', description: 'Department heads only' },
    { id: 'coordinator', label: 'Coordinators', description: 'Staff coordinators only' },
    { id: 'mentors', label: 'Senior Lecturers (Mentors)', description: 'All mentors' },
    { id: 'staff', label: 'Temporary Staff', description: 'All temporary staff members' }
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRecipient = (recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(recipientId)
        ? prev.recipients.filter(id => id !== recipientId)
        : [...prev.recipients, recipientId]
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.message || formData.recipients.length === 0) {
      alert('Please fill in title, message and select at least one recipient group!');
      return;
    }

    onSend(formData);
    
    // Reset form
    setFormData({
      title: '',
      message: '',
      type: 'info',
      recipients: []
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            <Bell className="h-6 w-6 text-[#4db4ac]" />
            Send System Notice
            <Badge className="bg-[#4db4ac] text-white">FR15</Badge>
          </DialogTitle>
          <DialogDescription className="text-[#555555] mt-2" style={{ fontSize: '14px' }}>
            Create and send important notices to users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#e6f7f6] p-4 rounded-lg">
            <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Create and send important notices to users
            </p>
            <p className="text-[#555555] mt-1" style={{ fontSize: '12px' }}>
              Notices will appear prominently at the top of user dashboards
            </p>
          </div>

          <Separator />

          {/* Notice Title */}
          <div>
            <Label htmlFor="title" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Notice Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., System Maintenance Scheduled"
              className="h-12 border-[#d0d0d0] focus:border-[#4db4ac] rounded-lg"
            />
          </div>

          {/* Notice Type */}
          <div>
            <Label className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Notice Type *
            </Label>
            <Select value={formData.type} onValueChange={(value: any) => handleChange('type', value)}>
              <SelectTrigger className="h-12 border-[#d0d0d0] rounded-lg focus:border-[#4db4ac]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div>
                    <p style={{ fontWeight: 600 }}>Information</p>
                    <p className="text-[#999999]" style={{ fontSize: '11px' }}>General announcements</p>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div>
                    <p style={{ fontWeight: 600 }}>Warning</p>
                    <p className="text-[#999999]" style={{ fontSize: '11px' }}>Important updates</p>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div>
                    <p style={{ fontWeight: 600 }}>Urgent</p>
                    <p className="text-[#999999]" style={{ fontSize: '11px' }}>Critical alerts</p>
                  </div>
                </SelectItem>
                <SelectItem value="deadline">
                  <div>
                    <p style={{ fontWeight: 600 }}>Deadline</p>
                    <p className="text-[#999999]" style={{ fontSize: '11px' }}>Time-sensitive tasks</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notice Message */}
          <div>
            <Label htmlFor="message" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Message *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Enter the notice message here..."
              className="min-h-[120px] border-[#d0d0d0] focus:border-[#4db4ac] rounded-lg"
              style={{ fontSize: '14px' }}
            />
          </div>

          <Separator />

          {/* Recipients */}
          <div>
            <Label className="text-[#555555] mb-3 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Send To * ({formData.recipients.length} selected)
            </Label>
            <div className="space-y-2">
              {recipientGroups.map((group) => (
                <div 
                  key={group.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.recipients.includes(group.id)
                      ? 'bg-[#e6f7f6] border-[#4db4ac]'
                      : 'bg-[#f9f9f9] border-transparent hover:bg-[#f0f0f0]'
                  }`}
                  onClick={() => toggleRecipient(group.id)}
                >
                  <Checkbox
                    checked={formData.recipients.includes(group.id)}
                    onCheckedChange={() => toggleRecipient(group.id)}
                    className="mt-1 data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
                  />
                  <div className="flex-1">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {group.label}
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '12px' }}>
                      {group.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {formData.title && formData.message && (
            <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4">
              <p className="text-[#222222] mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                Preview
              </p>
              <Separator className="my-2" />
              <div className={`p-3 rounded-lg ${
                formData.type === 'urgent' ? 'bg-red-50 border border-red-300' :
                formData.type === 'warning' ? 'bg-orange-50 border border-orange-300' :
                formData.type === 'deadline' ? 'bg-blue-50 border border-blue-300' :
                'bg-[#e6f7f6] border border-[#4db4ac]'
              }`}>
                <p className="text-[#222222] mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {formData.title}
                </p>
                <p className="text-[#555555]" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  {formData.message}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#d0d0d0] text-[#555555]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
            disabled={!formData.title || !formData.message || formData.recipients.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Notice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}