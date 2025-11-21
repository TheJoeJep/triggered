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

type AddOrganizationDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddOrganization: (name: string) => void;
};

export function AddOrganizationDialog({ isOpen, onOpenChange, onAddOrganization }: AddOrganizationDialogProps) {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!orgName.trim()) {
      setError("Organization name cannot be empty.");
      return;
    }
    setError("");
    onAddOrganization(orgName);
    setOrgName("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setOrgName("");
      setError("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Enter a name for your new organization. You'll be able to invite members later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. My Company"
            />
          </div>
           {error && <p className="col-span-4 text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleAdd}>Create Organization</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
