import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";
import { encodedRedirect } from "@/utils/utils";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = formData.get("id")?.toString();
  
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  
  if (!id) {
    return NextResponse.json(
      { error: "Milestone ID is required" },
      { status: 400 }
    );
  }
  
  // Get the milestone to find the project_id for redirect
  const { data: milestone } = await supabase
    .from("milestones")
    .select("project_id")
    .eq("id", id)
    .single();
  
  const projectId = milestone?.project_id;
  
  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: `Failed to delete milestone: ${error.message}` },
      { status: 500 }
    );
  }
  
  const redirectUrl = projectId
    ? `/dashboard/projects/${projectId}?success=${encodeURIComponent("Milestone deleted successfully")}`
    : "/dashboard/projects?success=${encodeURIComponent("Milestone deleted successfully")}`;
  
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
