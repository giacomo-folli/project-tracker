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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tables } from "@/types/supabase";
import { createMilestoneAction, updateMilestoneAction } from "@/app/actions";

type MilestoneFormProps = {
  milestone?: Tables<"milestones">;
  projectId: string;
  buttonText?: string;
  buttonVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
};

export default function MilestoneForm({
  milestone,
  projectId,
  buttonText = "Add Milestone",
  buttonVariant = "outline",
  buttonSize = "sm",
  className,
  onSuccess,
}: MilestoneFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!milestone;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      if (isEditing) {
        await updateMilestoneAction(formData);
      } else {
        await createMilestoneAction(formData);
      }
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={className}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Milestone" : "Add Milestone"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update milestone details below."
              : "Add a new milestone to track progress."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {isEditing ? (
            <input type="hidden" name="id" value={milestone.id} />
          ) : (
            <input type="hidden" name="project_id" value={projectId} />
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={milestone?.title || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                defaultValue={milestone?.description || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due_date" className="text-right">
                Due Date
              </Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={
                  milestone?.due_date
                    ? (() => {
                        try {
                          return new Date(milestone.due_date)
                            .toISOString()
                            .split("T")[0];
                        } catch (e) {
                          return "";
                        }
                      })()
                    : ""
                }
                className="col-span-3"
              />
            </div>
            {isEditing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_completed" className="text-right">
                  Completed
                </Label>
                <div className="col-span-3 flex items-center">
                  <input
                    type="checkbox"
                    id="is_completed"
                    name="is_completed"
                    value="true"
                    defaultChecked={milestone?.is_completed || false}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="is_completed"
                    className="ml-2 text-sm text-gray-600"
                  >
                    Mark as completed
                  </label>
                  <input
                    type="hidden"
                    name="previously_completed"
                    value={milestone?.is_completed?.toString() || "false"}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">{isEditing ? "Save Changes" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
