import { createClient } from "../../../supabase/server";
import FeedItem from "@/components/feed-item";
import { Tables } from "@/types/supabase";
import DashboardNavbar from "@/components/dashboard-navbar";

type FeedItemWithDetails = Tables<"feed_items"> & {
  likes: Tables<"likes">[];
  comments: Tables<"comments">[];
  users: Tables<"users"> | null;
  projects: Tables<"projects"> | null;
  milestones: Tables<"milestones"> | null;
};

export default async function FeedPage() {
  const supabase = await createClient();

  // Fetch feed items with likes and comments count
  const { data: feedItems, error } = await supabase
    .from("feed_items")
    .select(
      `
      *,
      likes(*),
      comments(*),
      users!feed_items_user_id_fkey(*)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching feed items:", error);
  }

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Activity Feed</h1>

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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
