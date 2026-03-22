import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BookOpen } from 'lucide-react';

interface ModulePreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (selectedModules: string[]) => void;
}

const availableModules = [
  'Fundamental of Computing',
  'Networking',
  'Optimization',
  'OOP Concepts',
  'Event Driven Programming',
  'HR Management',
  'Embedded Systems'
];

export default function ModulePreferencesDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: ModulePreferencesDialogProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const handleToggleModule = (module: string) => {
    if (selectedModules.includes(module)) {
      setSelectedModules(selectedModules.filter(m => m !== module));
    } else {
      setSelectedModules([...selectedModules, module]);
    }
  };

  const handleSubmit = () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module!');
      return;
    }
    onSubmit(selectedModules);
    setSelectedModules([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
            Select Your Module Preferences
          </DialogTitle>
          <DialogDescription className="text-[#555555]">
            Please select the modules you prefer to teach. Your selections will be sent to the coordinator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-red-600 text-white" style={{ fontSize: '10px' }}>
                IMPORTANT
              </Badge>
              <p className="text-red-700" style={{ fontSize: '13px', fontWeight: 600 }}>
                Module Preference Request from Coordinator
              </p>
            </div>
            <p className="text-[#555555]" style={{ fontSize: '12px' }}>
              The coordinator has requested your module preferences to assign appropriate teaching tasks.
            </p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-[#4db4ac]" />
              <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                Available Modules
              </Label>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableModules.map((module) => (
                <div 
                  key={module} 
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f9f9f9] transition-colors cursor-pointer"
                  onClick={() => handleToggleModule(module)}
                >
                  <Checkbox
                    id={module}
                    checked={selectedModules.includes(module)}
                    onCheckedChange={() => handleToggleModule(module)}
                  />
                  <label
                    htmlFor={module}
                    className="flex-1 text-[#222222] cursor-pointer"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    {module}
                  </label>
                </div>
              ))}
            </div>

            {selectedModules.length > 0 && (
              <div className="mt-4 p-3 bg-[#e6f7f6] rounded-lg">
                <p className="text-[#222222] mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Selected Modules ({selectedModules.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedModules.map((module) => (
                    <Badge 
                      key={module} 
                      className="bg-[#4db4ac] text-white border-0" 
                      style={{ fontSize: '11px' }}
                    >
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          >
            Submit Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
