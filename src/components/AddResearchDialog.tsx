import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { FlaskConical } from 'lucide-react';

interface AddResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (researchData: { title: string; description: string }) => void;
}

export default function AddResearchDialog({ open, onOpenChange, onSubmit }: AddResearchDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim()) {
      onSubmit(formData);
      setFormData({ title: '', description: '' });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-0 shadow-lg rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-[#4db4ac] flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                Add New Research Opportunity
              </DialogTitle>
              <DialogDescription className="text-[#555555]" style={{ fontSize: '14px' }}>
                Create a new research opportunity for temporary staff to apply
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Research Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter research opportunity title"
              className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg"
              style={{ fontSize: '14px' }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Research Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description of the research opportunity, objectives, and requirements"
              className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg min-h-[120px] resize-none"
              style={{ fontSize: '14px' }}
              required
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-[#e0e0e0] text-[#555555] hover:bg-[#f0f0f0] rounded-lg"
              style={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
              style={{ fontWeight: 600 }}
            >
              Create Research Opportunity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}