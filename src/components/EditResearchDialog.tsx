import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ResearchOpportunityDto } from '../services/api';

interface EditResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  research: ResearchOpportunityDto | null;
  onSubmit: (updates: { title: string; description: string }) => void;
}

export default function EditResearchDialog({ open, onOpenChange, research, onSubmit }: EditResearchDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!research) return;
    setTitle(research.title || '');
    setDescription(research.description || '');
  }, [research?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() });
    onOpenChange(false);
  };

  if (!research) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-0 shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
            Edit Research Opportunity
          </DialogTitle>
          <DialogDescription className="text-[#555555]" style={{ fontSize: '14px' }}>
            Update the title and description
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Research Title *
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Research Description
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-[#e0e0e0] focus:border-[#4db4ac] rounded-lg min-h-[120px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

