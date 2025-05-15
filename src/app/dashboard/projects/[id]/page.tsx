import { createClient } from "../../../../../supabase/server";
import { notFound, redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import ShareLinkButton from "@/components/share-link-button";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlusIcon,
  Share2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectForm from "@/components/project-form";
import MilestoneForm from "@/components/milestone-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !project) {
    console.error("Error fetching project:", error);
    return notFound();
  }

  const { data: milestones, error: milestonesError } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", params.id)
    .order("due_date", { ascending: true });

  if (milestonesError) {
    console.error("Error fetching milestones:", milestonesError);
  }

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

  const shareUrl = project.public_share_id
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1].split(".")[0]}.view-3.tempo-dev.app/projects/${project.public_share_id}`
    : null;

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Back Button */}
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Projects
              </Link>
            </Button>
          </div>

          {/* Project Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
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
              <p className="text-muted-foreground">
                {project.description || "No description provided."}
              </p>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <CalendarIcon size={14} className="mr-1" />
                <span>Last updated {formatDate(project.updated_at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <ProjectForm
                project={project}
                buttonText="Edit Project"
                buttonVariant="outline"
              />
              {project.is_public && project.public_share_id && shareUrl && (
                <ShareLinkButton shareUrl={shareUrl} />
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Progress</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Completion</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full",
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
          </div>

          {/* Milestones Section */}
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Milestones</h2>
              <MilestoneForm projectId={project.id} />
            </div>

            {milestones && milestones.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell className="font-medium">
                        {milestone.title}
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center text-xs px-2 py-0.5 rounded-full",
                            milestone.is_completed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800",
                          )}
                        >
                          {milestone.is_completed ? (
                            <>
                              <CheckCircle2Icon size={12} className="mr-1" />
                              Completed
                            </>
                          ) : (
                            <>
                              <ClockIcon size={12} className="mr-1" />
                              Pending
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        {milestone.due_date
                          ? formatDate(milestone.due_date)
                          : "No due date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <MilestoneForm
                            milestone={milestone}
                            projectId={project.id}
                            buttonText="Edit"
                            buttonVariant="ghost"
                            buttonSize="sm"
                          />
                          <form
                            action="/dashboard/projects/milestone/delete"
                            method="POST"
                          >
                            <input
                              type="hidden"
                              name="id"
                              value={milestone.id}
                            />
                            <Button variant="ghost" size="sm" type="submit">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <PlusIcon size={20} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No milestones yet</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  Break down your project into manageable milestones to track
                  progress more effectively.
                </p>
                <MilestoneForm
                  projectId={project.id}
                  buttonText="Add Your First Milestone"
                  buttonVariant="default"
                  buttonSize="default"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
