import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import ProjectForm from "@/components/project-form";
import ProjectCard from "@/components/project-card";
import { InfoIcon, PlusIcon } from "lucide-react";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track your projects
              </p>
            </div>
            <ProjectForm buttonText="New Project" />
          </header>

          {/* Info Section */}
          {projects && projects.length === 0 && (
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>
                You don&apos;t have any projects yet. Create your first project to
                get started.
              </span>
            </div>
          )}

          {/* Projects Grid */}
          {projects && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {projects && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/50 p-6 rounded-full mb-4">
                <PlusIcon size={24} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Create your first project to start tracking progress and sharing
                updates with your team or clients.
              </p>
              <ProjectForm buttonText="Create Your First Project" />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
