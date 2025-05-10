"use server";

import { encodedRedirect } from "@/utils/utils";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { Tables, TablesInsert } from "@/types/supabase";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  console.log("After signUp", error);

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // No need to manually insert into users table
  // The database trigger on auth.users will automatically create the user record
  // This avoids the RLS policy violation

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// Project CRUD actions
export const createProjectAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to create a project",
    );
  }

  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString() || null;
  const status = formData.get("status")?.toString() || "in_progress";
  // const progress = parseInt(formData.get("progress")?.toString() || "0"); // Progress is now calculated
  const isPublic = formData.get("is_public") === "true";

  if (!name) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project name is required",
    );
  }

  const newProject: TablesInsert<"projects"> = {
    name,
    description,
    status,
    progress: 0, // New projects start at 0% progress
    user_id: user.id,
    is_public: isPublic,
  };

  const { error } = await supabase.from("projects").insert(newProject);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to create project: ${error.message}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project created successfully",
  );
};

export const updateProjectAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to update a project",
    );
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString() || null;
  const status = formData.get("status")?.toString();
  // const progress = parseInt(formData.get("progress")?.toString() || "0"); // Progress is now calculated
  const isPublic = formData.get("is_public") === "true";

  if (!id || !name) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project ID and name are required",
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description,
      status,
      // progress, // Progress is now calculated via updateProjectProgress
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to update project: ${error.message}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  if (id) {
    revalidatePath(`/dashboard/projects/${id}`);
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project updated successfully",
  );
};

export const deleteProjectAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to delete a project",
    );
  }

  const id = formData.get("id")?.toString();

  if (!id) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project ID is required",
    );
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to delete project: ${error.message}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  if (id) {
    revalidatePath(`/dashboard/projects/${id}`);
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project deleted successfully",
  );
};

// Helper function to update project progress based on milestones
async function updateProjectProgress(projectId: string, userId: string) {
  const supabase = await createClient();

  // Fetch the project to ensure it belongs to the user (RLS check)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (projectError || !project) {
    console.error(
      `Error fetching project ${projectId} for progress update or not found:`,
      projectError?.message
    );
    // Decide if to throw or just log. For now, log and exit.
    return;
  }
  
  // Fetch all milestones for the project
  const { data: milestones, error: milestonesError } = await supabase
    .from("milestones")
    .select("id, is_completed")
    .eq("project_id", projectId);

  if (milestonesError) {
    console.error(
      `Error fetching milestones for project ${projectId}:`,
      milestonesError.message
    );
    return; // Exit if milestones can't be fetched
  }

  if (!milestones || milestones.length === 0) {
    // If no milestones, set progress to 0% (or 100% if preferred, e.g. project is considered complete)
    // For now, setting to 0 if no milestones.
    const { error: updateError } = await supabase
      .from("projects")
      .update({ progress: 0, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("user_id", userId); // Ensure RLS by re-checking user_id

    if (updateError) {
      console.error(
        `Error updating project ${projectId} progress to 0:`,
        updateError.message
      );
    }
    return;
  }

  const completedMilestones = milestones.filter((m) => m.is_completed).length;
  const totalMilestones = milestones.length;
  const calculatedProgress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0; // Default to 0 if no milestones (already handled above, but good for clarity)

  const { error: updateError } = await supabase
    .from("projects")
    .update({ progress: calculatedProgress, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId); // Ensure RLS

  if (updateError) {
    console.error(
      `Error updating project ${projectId} progress to ${calculatedProgress}%:`,
      updateError.message
    );
  } else {
    console.log(`Project ${projectId} progress updated to ${calculatedProgress}%`);
    // Revalidate paths that show project progress
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectId}`);
  }
}

// Milestone CRUD actions
export const createMilestoneAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to create a milestone",
    );
  }

  const projectId = formData.get("project_id")?.toString();
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString() || null;
  const dueDate = formData.get("due_date")?.toString() || null;

  if (!projectId || !title) {
    return encodedRedirect(
      "error",
      `/dashboard/projects`,
      "Project ID and title are required",
    );
  }

  // Verify the project belongs to the user
  const { data: project } = await supabase
    .from("projects")
    .select()
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project not found or you don't have permission",
    );
  }

  const { error } = await supabase.from("milestones").insert({
    project_id: projectId,
    title,
    description,
    due_date: dueDate,
  });

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      `/dashboard/projects`,
      `Failed to create milestone: ${error.message}`,
    );
  }

  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`);
  }
  // Also revalidate the main projects page if milestone counts are shown there
  revalidatePath("/dashboard/projects");

  // Update project progress
  if (projectId && user) {
    await updateProjectProgress(projectId, user.id);
  }

  return encodedRedirect(
    "success",
    `/dashboard/projects`, // Consider redirecting to the specific project page
    "Milestone created successfully",
  );
};

export const updateMilestoneAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to update a milestone",
    );
  }

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString() || null;
  const dueDate = formData.get("due_date")?.toString() || null;
  const isCompleted = formData.get("is_completed") === "true";
  const projectId = formData.get("project_id")?.toString(); // Assuming project_id is available for revalidation

  if (!id || !title) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone ID and title are required",
    );
  }

  // It's good practice to also fetch the milestone to get its project_id if not passed in formData
  // For now, assuming projectId might be passed or could be retrieved if needed for revalidation.
  // If not directly available, this revalidatePath for specific project might not work as intended
  // without an extra fetch for the milestone's project_id before update/delete.

  const { error } = await supabase
    .from("milestones")
    .update({
      title,
      description,
      due_date: dueDate,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to update milestone: ${error.message}`,
    );
  }
  
  revalidatePath("/dashboard");
  if (projectId) { // If projectId is available from form or fetched
    revalidatePath(`/dashboard/projects/${projectId}`);
  }
  revalidatePath("/dashboard/projects");

  // Update project progress
  if (projectId && user) { // user should be defined due to earlier check
    await updateProjectProgress(projectId, user.id);
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects", // Consider redirecting to the specific project page
    "Milestone updated successfully",
  );
};

export const deleteMilestoneAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to delete a milestone",
    );
  }

  const id = formData.get("id")?.toString();

  if (!id) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone ID is required",
    );
  }

  const { error } = await supabase.from("milestones").delete().eq("id", id);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to delete milestone: ${error.message}`,
    );
  }

  // To properly revalidate the specific project page, we'd ideally have projectId here.
  // This might require fetching the milestone before deleting it to get its project_id,
  // or ensuring projectId is passed in the formData for delete operations.
  // For now, we'll revalidate the general paths.
  
  // Fetch the milestone before deleting to get its project_id
  const { data: originalMilestone, error: fetchError } = await supabase
    .from("milestones")
    .select("id, project_id")
    .eq("id", id)
    .eq("user_id", user.id) // Ensure the user owns the milestone's project indirectly or milestone itself
    .single();

  if (fetchError || !originalMilestone) {
    console.error(`Error fetching milestone ${id} for deletion or not found:`, fetchError?.message);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Failed to find milestone for deletion or permission denied.",
    );
  }

  const { error: deleteError } = await supabase.from("milestones").delete().eq("id", id);

  if (deleteError) {
    console.error(deleteError);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to delete milestone: ${deleteError.message}`,
    );
  }
  
  // Revalidation paths (already present, but good to confirm)
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  // If you pass projectId in formData for delete, you can add:
  // const projectId = formData.get("project_id")?.toString();
  // if (projectId) { revalidatePath(`/dashboard/projects/${projectId}`); }

  // To update project progress, we need projectId.
  // It was fetched before deletion (see above).
  if (originalMilestone && originalMilestone.project_id && user) {
    await updateProjectProgress(originalMilestone.project_id, user.id);
  }


  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Milestone deleted successfully",
  );
};
