
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Tables } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardStatsProps = {
  projects: Tables<"projects">[];
  milestones: Tables<"milestones">[];
};

export default function DashboardStats({ projects, milestones }: DashboardStatsProps) {
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const onHoldProjects = projects.filter(p => p.status === "on_hold").length;

  const upcomingMilestones = milestones.filter(m => !m.is_completed).length;
  const completedMilestones = milestones.filter(m => m.is_completed).length;

  const projectData = [
    { name: "Active", value: activeProjects, color: "#8b5cf6" },
    { name: "Completed", value: completedProjects, color: "#a78bfa" },
    { name: "On Hold", value: onHoldProjects, color: "#c4b5fd" },
  ];

  const milestoneData = [
    { name: "Upcoming", value: upcomingMilestones, color: "#8b5cf6" },
    { name: "Completed", value: completedMilestones, color: "#c4b5fd" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {projectData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-sm">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={milestoneData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {milestoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {milestoneData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-sm">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{projects.length}</span>
            <span className="text-sm text-muted-foreground">Total Projects</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{milestones.length}</span>
            <span className="text-sm text-muted-foreground">Total Milestones</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold">
              {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length || 0)}%
            </span>
            <span className="text-sm text-muted-foreground">Average Progress</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
