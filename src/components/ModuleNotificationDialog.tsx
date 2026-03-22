import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Bell, Send } from 'lucide-react';
import { Separator } from './ui/separator';

interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
}

interface ModuleNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (selectedModules: string[], message: string) => void;
}

export default function ModuleNotificationDialog({ 
  open, 
  onOpenChange, 
  onSend 
}: ModuleNotificationDialogProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  const availableModules: Module[] = [
    { id: 'MOD001', code: 'MKT 301', name: 'Marketing Management', credits: 3 },
    { id: 'MOD002', code: 'MKT 302', name: 'Consumer Behavior', credits: 3 },
    { id: 'MOD003', code: 'OPM 301', name: 'Operations Management', credits: 3 },
    { id: 'MOD004', code: 'HRM 301', name: 'Human Resource Management', credits: 3 },
    { id: 'MOD005', code: 'SCM 301', name: 'Supply Chain Management', credits: 3 },
    { id: 'MOD006', code: 'FIN 301', name: 'Financial Management', credits: 3 }
  ];

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSend = () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module!');
      return;
    }
    onSend(selectedModules, customMessage);
    setSelectedModules([]);
    setCustomMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2" style={{ fontWeight: 700, fontSize: '20px' }}>
            <Bell className="h-6 w-6 text-[#4db4ac]" />
            Notify Staff of Available Modules
            <Badge className="bg-[#4db4ac] text-white">FR11</Badge>
          </DialogTitle>
          <DialogDescription className="text-[#555555] mt-2" style={{ fontSize: '14px' }}>
            Select modules to notify newly registered temporary staff. Staff members will receive email notifications about these available teaching modules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Module Selection */}
          <div>
            <Label className="text-[#555555] mb-3 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Available Modules ({selectedModules.length} selected)
            </Label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-[#e0e0e0] rounded-lg p-3">
              {availableModules.map((module) => (
                <div 
                  key={module.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    selectedModules.includes(module.id) 
                      ? 'bg-[#e6f7f6] border-2 border-[#4db4ac]' 
                      : 'bg-[#f9f9f9] border-2 border-transparent hover:bg-[#f0f0f0]'
                  }`}
                  onClick={() => toggleModule(module.id)}
                >
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => toggleModule(module.id)}
                    className="mt-1 data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={module.id} 
                      className="text-[#222222] cursor-pointer" 
                      style={{ fontSize: '14px', fontWeight: 600 }}
                    >
                      {module.code} - {module.name}
                    </label>
                    <p className="text-[#555555] mt-1" style={{ fontSize: '12px' }}>
                      Credits: {module.credits}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="custom-message" className="text-[#555555] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
              Additional Message (Optional)
            </Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any additional information or instructions for the staff members..."
              className="min-h-[100px] border-[#d0d0d0] focus:border-[#4db4ac] rounded-lg"
              style={{ fontSize: '14px' }}
            />
          </div>

          {/* Preview */}
          {selectedModules.length > 0 && (
            <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4">
              <p className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                Notification Preview
              </p>
              <Separator className="my-2" />
              <p className="text-[#555555]" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                Dear Temporary Staff Member,<br /><br />
                The following modules are now available for assignment:<br /><br />
                {availableModules
                  .filter(m => selectedModules.includes(m.id))
                  .map(m => `• ${m.code} - ${m.name} (${m.credits} credits)`)
                  .join('\n')}
                <br /><br />
                {customMessage && (
                  <>
                    {customMessage}<br /><br />
                  </>
                )}
                Please contact the coordinator for more information.<br /><br />
                Best regards,<br />
                Department of Industrial Management
              </p>
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
            onClick={handleSend}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
            disabled={selectedModules.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Notification ({selectedModules.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}