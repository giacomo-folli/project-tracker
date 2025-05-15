import { createClient } from "../../../../supabase/server";
import FeedItem from "@/components/feed-item";
import { Tables } from "@/types/supabase";
import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";

type FeedItemWithDetails = Tables<"feed_items"> & {
  likes: Tables<"likes">[];
  comments: Tables<"comments">[];
  users: Tables<"users"> | null;
  projects: Tables<"projects"> | null;
  milestones: Tables<"milestones"> | null;
};

export default async function DashboardFeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // First, check if we can fetch basic feed items
  const { data: basicFeedItems, error: basicError } = await supabase
    .from("feed_items")
    .select("*")
    .order("created_at", { ascending: false });

  // Now try the full query with relationships
  // Use a try-catch to handle potential join errors
  let feedItems = [];
  let error = null;

  try {
    const response = await supabase
      .from("feed_items")
      .select(
        `
        *,
        likes(*),
        comments(*),
        users(*),
        projects(*),
        milestones(*)
        `,
      )
      .order("created_at", { ascending: false });

    feedItems = response.data || [];
    error = response.error;
  } catch (e) {
    console.error("Error fetching feed items:", e);
    error = { message: "Failed to load feed items. Please try again." };
    // Fall back to basic feed items if available
    feedItems = basicFeedItems || [];
  }

  // Feed items fetched successfully

  // If no feed items exist, let's create a test one for debugging
  if (!feedItems || feedItems.length === 0) {
    // Check if there are any projects
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (projects && projects.length > 0) {
      // Check if there are any milestones for this project
      const { data: milestones } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projects[0].id)
        .limit(1);
    }
  }

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Activity Feed</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p className="font-medium">Error loading feed items</p>
              <p className="text-sm">{error.message}</p>
              <p className="text-sm mt-2">
                Try using the{" "}
                <a
                  href="/dashboard/feed/debug"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  debug tools
                </a>{" "}
                to create test feed items.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {feedItems && feedItems.length > 0 ? (
              feedItems.map((item) => (
                <FeedItem
                  key={item.id}
                  feedItem={item as FeedItemWithDetails}
                />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">
                  No activity yet. When users complete milestones, they will
                  appear here.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Try creating a project and completing some milestones to see
                  activity, or use the{" "}
                  <a
                    href="/dashboard/feed/debug"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    debug tools
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
