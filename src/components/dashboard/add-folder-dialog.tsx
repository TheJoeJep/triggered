"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddFolderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddFolder: (name: string) => void;
};

export function AddFolderDialog({ isOpen, onOpenChange, onAddFolder }: AddFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!folderName.trim()) {
      setError("Folder name cannot be empty.");
      return;
    }
    setError("");
    onAddFolder(folderName);
    setFolderName("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFolderName("");
      setError("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder to organize your triggers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Production Webhooks"
            />
          </div>
           {error && <p className="col-span-4 text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleAdd}>Add Folder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
