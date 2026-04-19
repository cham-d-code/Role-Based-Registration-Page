import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { deleteMyAccount, logout } from '../services/api';
import { Loader2, Trash2 } from 'lucide-react';

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Irreversible account deletion — calls DELETE /api/user/me then clears session.
 */
export default function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = phrase.trim() === CONFIRM_PHRASE;

  const handleClose = (next: boolean) => {
    if (!next) setPhrase('');
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await deleteMyAccount();
      logout();
      window.location.href = '/';
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not delete account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete your account?
          </DialogTitle>
          <DialogDescription className="text-[#555555] text-left space-y-2 pt-2">
            <span className="block">
              This permanently removes your user account, profile data, notifications, and other records tied to you
              (including marking schemes you created and your session participation). This cannot be undone.
            </span>
            <span className="block font-semibold text-red-700">
              Type <span className="font-mono bg-red-50 px-1 rounded">{CONFIRM_PHRASE}</span> below to confirm.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="delete-confirm" className="text-[#555555]">
            Confirmation
          </Label>
          <Input
            id="delete-confirm"
            autoComplete="off"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="font-mono text-sm"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || busy}
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete account forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
