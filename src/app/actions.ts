"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { TablesInsert } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper function to update project progress based on milestones
async function updateProjectProgress(
  supabase: SupabaseClient,
  projectId: string
) {
  try {
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId);

    if (milestonesError) {
      throw new Error(milestonesError.message);
    }

    const completedMilestones = milestones.filter(
      (m: { is_completed: boolean }) => m.is_completed
    );

    let progress = 0;
    if (milestones.length > 0) {
      progress = (completedMilestones.length / milestones.length) * 100;
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error: unknown) {
    console.error("Error in updateProjectProgress:", (error as Error).message);
  }
}

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
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
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
    "Thanks for signing up! Please check your email for a verification link."
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
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
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
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

// Profile update actions
export const updateProfileAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to update your profile"
    );
  }

  const fullName = formData.get("fullName")?.toString() || "";
  const email = formData.get("email")?.toString() || "";

  // Check if email is being changed
  const emailChanged = email !== user.email;

  try {
    // Update user metadata and email if changed
    const { error: authUpdateError } = await supabase.auth.updateUser({
      email: emailChanged ? email : undefined,
      data: { full_name: fullName },
    });

    if (authUpdateError) throw authUpdateError;

    // Update profile in the database
    const { error: profileUpdateError } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateError) throw profileUpdateError;

    // Use direct redirect instead of encodedRedirect to avoid NEXT_REDIRECT error
    const successMessage = emailChanged
      ? "Profile updated. Please verify your new email address."
      : "Profile updated successfully";
    return redirect(
      `/dashboard/profile?success=${encodeURIComponent(successMessage)}`
    );
  } catch (error: unknown) {
    console.error("Error updating profile:", (error as Error).message);
    return encodedRedirect(
      "error",
      "/dashboard/profile",
      `Failed to update profile: ${(error as Error).message}`
    );
  }
};

export const updatePersonaAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to update your persona"
    );
  }

  const bio = formData.get("bio")?.toString() || "";
  const passions = formData.get("passions")?.toString() || "";
  const workProjects = formData.get("workProjects")?.toString() || "";

  try {
    // Update profile in the database
    const { error: profileUpdateError } = await supabase
      .from("users")
      .update({
        bio,
        passions,
        work_projects: workProjects,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateError) throw profileUpdateError;

    // Use direct redirect to avoid NEXT_REDIRECT error
    return redirect(
      `/dashboard/profile?tab=persona&success=${encodeURIComponent("Persona updated successfully")}`
    );
  } catch (error: unknown) {
    console.error("Error updating persona:", (error as Error).message);
    // Use direct redirect instead of encodedRedirect to avoid NEXT_REDIRECT error
    return redirect(
      `/dashboard/profile?tab=persona&error=${encodeURIComponent(`Failed to update persona: ${(error as Error).message}`)}`
    );
  }
};

export const changePasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to change your password"
    );
  }

  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/profile?tab=password",
      "All password fields are required"
    );
  }

  if (newPassword !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/profile?tab=password",
      "New passwords do not match"
    );
  }

  try {
    // First sign in with the current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return encodedRedirect(
        "error",
        "/dashboard/profile?tab=password",
        "Current password is incorrect"
      );
    }

    // Then update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    return encodedRedirect(
      "success",
      "/dashboard/profile?tab=password",
      "Password changed successfully"
    );
  } catch (error: unknown) {
    console.error("Error changing password:", (error as Error).message);
    return encodedRedirect(
      "error",
      "/dashboard/change-password",
      `Failed to change password: ${(error as Error).message}`
    );
  }
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
      "You must be logged in to create a project"
    );
  }

  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString() || null;
  const status = formData.get("status")?.toString() || "in_progress";
  const progress = parseInt(formData.get("progress")?.toString() || "0");
  const isPublic = formData.get("is_public") === "true";

  if (!name) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project name is required"
    );
  }

  const newProject: TablesInsert<"projects"> = {
    name,
    description,
    status,
    progress,
    user_id: user.id,
    is_public: isPublic,
  };

  const { error } = await supabase.from("projects").insert(newProject);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to create project: ${error.message}`
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project created successfully"
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
      "You must be logged in to update a project"
    );
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString() || null;
  const status = formData.get("status")?.toString();
  const progress = parseInt(formData.get("progress")?.toString() || "0");
  const isPublic = formData.get("is_public") === "true";

  if (!id || !name) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project ID and name are required"
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description,
      status,
      progress,
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
      `Failed to update project: ${error.message}`
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project updated successfully"
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
      "You must be logged in to delete a project"
    );
  }

  const id = formData.get("id")?.toString();

  if (!id) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Project ID is required"
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
      `Failed to delete project: ${error.message}`
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project deleted successfully"
  );
};

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
      "You must be logged in to create a milestone"
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
      "Project ID and title are required"
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
      "Project not found or you don't have permission"
    );
  }

  // Insert the milestone
  const { data: milestone, error: milestoneError } = await supabase
    .from("milestones")
    .insert({
      project_id: projectId,
      title,
      description,
      due_date: dueDate,
    })
    .select()
    .single();

  if (milestoneError) {
    console.error(milestoneError);
    return encodedRedirect(
      "error",
      `/dashboard/projects`,
      `Failed to create milestone: ${milestoneError.message}`
    );
  }

  // Create a feed item for the new milestone
  const { data: feedItem, error: feedError } = await supabase
    .from("feed_items")
    .insert({
      project_id: projectId,
      milestone_id: milestone.id,
      user_id: user.id,
      type: "milestone_created",
      data: {
        milestone_title: title,
        project_name: project.name,
        user_name: user.user_metadata?.full_name || "Anonymous",
      },
    })
    .select();

  console.log("Created feed item for new milestone:", {
    success: !feedError,
    feedItemId: feedItem?.[0]?.id,
    error: feedError?.message,
  });

  if (feedError) {
    console.error("Failed to create feed item:", feedError);
    // Continue even if feed item creation fails
  }

  // Update project progress based on milestones
  await updateProjectProgress(supabase, projectId);

  return encodedRedirect(
    "success",
    `/dashboard/projects`,
    "Milestone created successfully"
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
      "You must be logged in to update a milestone"
    );
  }

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString() || null;
  const dueDate = formData.get("due_date")?.toString() || null;
  const isCompleted = formData.get("is_completed") === "true";
  const previouslyCompleted = formData.get("previously_completed") === "true";

  if (!id || !title) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone ID and title are required"
    );
  }

  // Get milestone details before update to get project_id
  const { data: existingMilestone } = await supabase
    .from("milestones")
    .select("project_id, title")
    .eq("id", id)
    .single();

  if (!existingMilestone) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone not found"
    );
  }

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
      `Failed to update milestone: ${error.message}`
    );
  }

  // If milestone is newly completed, create a feed item
  if (isCompleted && !previouslyCompleted) {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", existingMilestone.project_id)
      .single();

    // Create feed item
    const { data: feedItem, error: feedError } = await supabase
      .from("feed_items")
      .insert({
        project_id: existingMilestone.project_id,
        milestone_id: id,
        user_id: user.id,
        type: "milestone_completed",
        data: {
          milestone_title: title,
          project_name: project?.name || "Unknown Project",
          user_name: user.user_metadata?.full_name || "Anonymous",
        },
      })
      .select();

    console.log("Created feed item for completed milestone:", {
      success: !feedError,
      feedItemId: feedItem?.[0]?.id,
      error: feedError?.message,
    });

    if (feedError) {
      console.error("Failed to create feed item:", feedError);
      // Continue even if feed item creation fails
    }
  }

  // Update project progress based on milestones
  await updateProjectProgress(supabase, existingMilestone.project_id);

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Milestone updated successfully"
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
      "You must be logged in to delete a milestone"
    );
  }

  const id = formData.get("id")?.toString();

  if (!id) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone ID is required"
    );
  }

  // Get milestone details before deletion to get project_id
  const { data: milestone } = await supabase
    .from("milestones")
    .select("project_id")
    .eq("id", id)
    .single();

  if (!milestone) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone not found"
    );
  }

  const projectId = milestone.project_id;

  const { error } = await supabase.from("milestones").delete().eq("id", id);

  if (error) {
    console.error(error);
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      `Failed to delete milestone: ${error.message}`
    );
  }

  // Update project progress after milestone deletion
  await updateProjectProgress(supabase, projectId);

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Milestone deleted successfully"
  );
};
