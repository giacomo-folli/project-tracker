import DashboardNavbar from "@/components/dashboard-navbar";
// import DashboardStats from "@/components/dashboard-stats"; // Will be dynamically imported
import { InfoIcon, UserCircle } from "lucide-react";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "../../../supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }



  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, status, progress") // Select only necessary columns
    .eq("user_id", user.id);

  const projects = projectsData || [];

  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("is_completed") // Select only necessary columns
    .in(
      "project_id",
      projects.map((p) => p.id)
    );
  
  const milestones = milestonesData || [];

  // Calculate stats on the server
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const onHoldProjects = projects.filter(p => p.status === "on_hold").length;
  const totalProjects = projects.length;
  const averageProgress = Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects || 0);

  const upcomingMilestones = milestones.filter(m => !m.is_completed).length;
  const completedMilestonesCount = milestones.filter(m => m.is_completed).length;
  const totalMilestones = milestones.length;

  const stats = {
    activeProjects,
    completedProjects,
    onHoldProjects,
    totalProjects,
    averageProgress,
    upcomingMilestones,
    completedMilestones: completedMilestonesCount, // Renamed to avoid conflict
    totalMilestones,
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>This is a protected page only visible to authenticated users</span>
            </div>
          </header>

          {/* Dashboard Stats */}
          <DynamicDashboardStats stats={stats} />
          <DynamicDashboardSecondaryStats stats={stats} />

          {/* User Profile Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 overflow-hidden">
              <pre className="text-xs font-mono max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

// Skeleton loader for DashboardStats
const DashboardStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-card rounded-lg border shadow-sm p-5">
        <div className="h-8 bg-muted rounded w-3/4 mb-4 animate-pulse"></div>
        <div className="h-48 bg-muted rounded animate-pulse"></div>
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const DynamicDashboardStats = dynamic(
  () => import("@/components/dashboard-stats"),
  {
    loading: () => <DashboardStatsSkeleton />, // Re-using the same skeleton for now
    ssr: false
  }
);

// Skeleton loader for DashboardSecondaryStats (can be customized later)
const DashboardSecondaryStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-card rounded-lg border shadow-sm p-5">
        <div className="h-8 bg-muted rounded w-3/4 mb-4 animate-pulse"></div>
        <div className="h-24 bg-muted rounded animate-pulse"></div> {/* Adjusted height for potentially different content */}
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const DynamicDashboardSecondaryStats = dynamic(
  () => import("@/components/dashboard-secondary-stats"),
  {
    loading: () => <DashboardSecondaryStatsSkeleton />,
    ssr: false
  }
);
