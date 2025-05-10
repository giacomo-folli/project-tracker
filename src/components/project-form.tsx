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
import { createProjectAction, updateProjectAction } from "@/app/actions";

type ProjectFormProps = {
  project?: Tables<"projects">;
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
  refreshProjects?: () => void;
};

export default function ProjectForm({
  project,
  buttonText = "Create Project",
  buttonVariant = "default",
  buttonSize = "default",
  className,
  onSuccess,
  refreshProjects,
}: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!project;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      if (isEditing) {
        await updateProjectAction(formData);
      } else {
        await createProjectAction(formData);
      }
      setOpen(false);
      if (onSuccess) onSuccess();
      if (refreshProjects) refreshProjects();
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
            {isEditing ? "Edit Project" : "Create Project"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your project details below."
              : "Fill in the details for your new project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {isEditing && <input type="hidden" name="id" value={project.id} />}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={project?.name || ""}
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
                defaultValue={project?.description || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={project?.status || "in_progress"}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="progress" className="text-right">
                Progress (%)
              </Label>
              <Input
                id="progress"
                name="progress"
                type="number"
                min="0"
                max="100"
                defaultValue={project?.progress || 0}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_public" className="text-right">
                Public
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  value="true"
                  defaultChecked={project?.is_public || false}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="is_public"
                  className="ml-2 text-sm text-gray-600"
                >
                  Make this project publicly viewable
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
