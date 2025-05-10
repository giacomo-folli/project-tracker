"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Assuming you have a Progress component

type StatsData = {
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalProjects: number;
  averageProgress: number;
  upcomingMilestones: number;
  completedMilestones: number;
  totalMilestones: number;
};

type DashboardSecondaryStatsProps = {
  stats: StatsData;
};

export default function DashboardSecondaryStats({ stats }: DashboardSecondaryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3"> 

      {/* Widget 2: Milestone Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Upcoming Milestones</span>
            <span className="font-semibold">{stats.upcomingMilestones}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Completed Milestones</span>
            <span className="font-semibold">{stats.completedMilestones}</span>
          </div>
          <hr />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Milestones</span>
            <span className="text-lg font-bold">{stats.totalMilestones}</span>
          </div>
        </CardContent>
      </Card>

      {/* Widget 3: Project Lifecycle */}
      <Card>
        <CardHeader>
          <CardTitle>Project Lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
            <span className="text-sm font-medium">Total Projects Initiated</span>
            <span className="text-lg font-bold text-primary">{stats.totalProjects}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
            <span className="text-sm text-green-700 dark:text-green-400">Active Projects</span>
            <span className="font-semibold text-green-700 dark:text-green-400">{stats.activeProjects}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-md">
            <span className="text-sm text-blue-700 dark:text-blue-400">Completed Projects</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">{stats.completedProjects}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
            <span className="text-sm text-yellow-700 dark:text-yellow-500">On Hold Projects</span>
            <span className="font-semibold text-yellow-700 dark:text-yellow-500">{stats.onHoldProjects}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}