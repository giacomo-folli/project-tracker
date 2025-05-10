"use server";

import { encodedRedirect } from "@/utils/utils";
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
  const progress = parseInt(formData.get("progress")?.toString() || "0");
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
      `Failed to create project: ${error.message}`,
    );
  }

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
  const progress = parseInt(formData.get("progress")?.toString() || "0");
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
      `Failed to update project: ${error.message}`,
    );
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

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Project deleted successfully",
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

  return encodedRedirect(
    "success",
    `/dashboard/projects`,
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

  if (!id || !title) {
    return encodedRedirect(
      "error",
      "/dashboard/projects",
      "Milestone ID and title are required",
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
      `Failed to update milestone: ${error.message}`,
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/projects",
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

  return encodedRedirect(
    "success",
    "/dashboard/projects",
    "Milestone deleted successfully",
  );
};
