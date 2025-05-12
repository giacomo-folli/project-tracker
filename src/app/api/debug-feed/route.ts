import { NextRequest, NextResponse } from "next/server";
import { createClientWithCookies } from "../../../../supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = await createClientWithCookies(cookieStore);

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (projectsError) {
      return NextResponse.json(
        { error: projectsError.message },
        { status: 500 },
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        { message: "No projects found. Please create a project first." },
        { status: 200 },
      );
    }

    const projectId = projects[0].id;

    // Get a milestone for this project
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .limit(1);

    if (milestonesError) {
      return NextResponse.json(
        { error: milestonesError.message },
        { status: 500 },
      );
    }

    let milestoneId;

    if (!milestones || milestones.length === 0) {
      // Create a milestone if none exists
      const { data: newMilestone, error: newMilestoneError } = await supabase
        .from("milestones")
        .insert({
          project_id: projectId,
          title: "Debug Milestone",
          description: "This milestone was created for debugging purposes",
          is_completed: false,
        })
        .select();

      if (newMilestoneError) {
        return NextResponse.json(
          { error: newMilestoneError.message },
          { status: 500 },
        );
      }

      milestoneId = newMilestone?.[0]?.id;
    } else {
      milestoneId = milestones[0].id;
    }

    // Create a feed item
    const { data: feedItem, error: feedError } = await supabase
      .from("feed_items")
      .insert({
        project_id: projectId,
        milestone_id: milestoneId,
        user_id: user.id,
        type: "milestone_created",
        data: {
          milestone_title: "Debug Milestone",
          project_name: projects[0].name,
          user_name: user.user_metadata?.full_name || "Anonymous",
        },
      })
      .select();

    if (feedError) {
      return NextResponse.json({ error: feedError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Debug feed item created successfully",
        feedItem: feedItem?.[0],
        project: projects[0],
        milestone: milestones?.[0] || "New milestone created",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Debug feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
