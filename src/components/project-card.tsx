"use client";

import { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProjectForm from "@/components/project-form";
import { deleteProjectAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  Share2Icon,
} from "lucide-react";

type ProjectCardProps = {
  project: Tables<"projects">;
};

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this project?")) {
      setIsDeleting(true);
      try {
        const formData = new FormData();
        formData.append("id", project.id);
        await deleteProjectAction(formData);
        router.refresh(); // Use router.refresh() instead of callback
      } catch (error) {
        console.error("Error deleting project:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started":
        return "Not Started";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "on_hold":
        return "On Hold";
      default:
        return status;
    }
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg truncate" title={project.name}>
          {project.name}
        </h3>
        <div className="flex items-center gap-1">
          {project.is_public && (
            <span className="inline-flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              <Share2Icon size={12} className="mr-1" /> Public
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center text-xs px-2 py-0.5 rounded-full",
              getStatusColor(project.status),
            )}
          >
            {project.status === "completed" ? (
              <CheckCircle2Icon size={12} className="mr-1" />
            ) : (
              <ClockIcon size={12} className="mr-1" />
            )}
            {getStatusLabel(project.status)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || "No description provided."}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full",
              project.progress === 100
                ? "bg-green-500"
                : project.progress > 50
                  ? "bg-blue-500"
                  : "bg-primary",
            )}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center text-xs text-muted-foreground mb-4">
        <CalendarIcon size={12} className="mr-1" />
        <span>Updated {formatDate(project.updated_at)}</span>
      </div>

      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
        <div className="flex gap-2">
          <ProjectForm
            project={project}
            buttonText="Edit"
            buttonVariant="secondary"
            buttonSize="sm"
            onSuccess={() => router.refresh()} // Use router.refresh() instead of callback
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
