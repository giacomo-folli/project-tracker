import { createClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PublicProjectPage({
  params,
}: {
  params: { shareId: string };
}) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("public_share_id", params.shareId)
    .eq("is_public", true)
    .single();

  if (error || !project) {
    console.error("Error fetching project:", error);
    return notFound();
  }

  const { data: milestones, error: milestonesError } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", project.id)
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

  return (
    <main className="w-full bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Back Button */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>

        {/* Project Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
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
            <p className="text-muted-foreground">
              {project.description || "No description provided."}
            </p>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <CalendarIcon size={14} className="mr-1" />
              <span>Last updated {formatDate(project.updated_at)}</span>
            </div>
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
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Milestones</h2>
          </div>

          {milestones && milestones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No milestones have been added to this project yet.
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground py-4">
          <p>
            This is a public view of this project. Updates are made in
            real-time.
          </p>
        </div>
      </div>
    </main>
  );
}
