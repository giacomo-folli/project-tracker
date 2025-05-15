"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { Tables } from "@/types/supabase";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Heart, MessageCircle, Send, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "@/utils/utils";

type FeedItemWithDetails = Tables<"feed_items"> & {
  likes: Tables<"likes">[];
  comments: Tables<"comments">[];
  users: Tables<"users"> | null;
  projects: Tables<"projects"> | null;
  milestones: Tables<"milestones"> | null;
};

type CommentWithUser = Tables<"comments"> & {
  users: Tables<"users"> | null;
};

export default function FeedItem({
  feedItem,
}: {
  feedItem: FeedItemWithDetails;
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(feedItem.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    console.log("Feed item data:", {
      id: feedItem.id,
      type: feedItem.type,
      data: feedItem.data,
      user: feedItem.users,
      project: feedItem.projects,
      milestone: feedItem.milestones,
      likes: feedItem.likes?.length,
      comments: feedItem.comments?.length,
    });
  }, [feedItem]);

  const handleLike = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to like a post");
        return;
      }

      if (isLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("feed_item_id", feedItem.id)
          .eq("user_id", user.id);
        setLikesCount((prev) => prev - 1);
      } else {
        // Like
        await supabase.from("likes").insert({
          feed_item_id: feedItem.id,
          user_id: user.id,
        });
        setLikesCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error("Error handling like:", err);
      setError("Failed to update like status");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to comment");
        return;
      }

      const { data: newComment, error: commentError } = await supabase
        .from("comments")
        .insert({
          feed_item_id: feedItem.id,
          user_id: user.id,
          content: comment,
        })
        .select("*, users:user_id(*)");

      if (commentError) {
        console.error("Error adding comment:", commentError);
        setError("Failed to add comment");
        return;
      }

      if (newComment) {
        setComments((prev) => [...prev, newComment[0] as CommentWithUser]);
        setComment("");
      }
    } catch (err) {
      console.error("Error handling comment:", err);
      setError("Failed to add comment");
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { data, error: commentsError } = await supabase
          .from("comments")
          .select("*, users:user_id(*)")
          .eq("feed_item_id", feedItem.id)
          .order("created_at", { ascending: true });

        if (commentsError) {
          console.error("Error loading comments:", commentsError);
          setError("Failed to load comments");
          return;
        }

        if (data) {
          setComments(data as CommentWithUser[]);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
        setError("Failed to load comments");
      }
    }
    setShowComments(!showComments);
  };

  // Check if current user has liked this feed item
  const checkIfLiked = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error: likesError } = await supabase
          .from("likes")
          .select()
          .eq("feed_item_id", feedItem.id)
          .eq("user_id", user.id);

        if (likesError) {
          console.error("Error checking likes:", likesError);
          return;
        }

        setIsLiked(!!data && data.length > 0);
      }
    } catch (err) {
      console.error("Error checking if liked:", err);
    }
  };

  // Call this when component mounts
  useEffect(() => {
    checkIfLiked();
  }, []);

  // Format the data based on the feed item type
  const renderFeedContent = () => {
    try {
      const data = feedItem.data as any;

      if (!data) {
        return <p>Missing feed item data</p>;
      }

      if (feedItem.type === "milestone_completed") {
        return (
          <div>
            <p className="font-medium">
              {data.user_name || "A user"} completed a milestone:{" "}
              <span className="font-bold">
                {data.milestone_title || "Unnamed milestone"}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Project: {data.project_name || "Unnamed project"}
            </p>
          </div>
        );
      } else if (feedItem.type === "milestone_created") {
        return (
          <div>
            <p className="font-medium">
              {data.user_name || "A user"} created a new milestone:{" "}
              <span className="font-bold">
                {data.milestone_title || "Unnamed milestone"}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Project: {data.project_name || "Unnamed project"}
            </p>
          </div>
        );
      }
      return <p>Unknown activity: {feedItem.type}</p>;
    } catch (err) {
      console.error("Error rendering feed content:", err);
      return <p>Error displaying feed item</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage src={feedItem.users?.avatar_url || undefined} />
            <AvatarFallback>
              {(() => {
                try {
                  return (
                    (feedItem.data as any)?.user_name?.substring(0, 2) || "U"
                  ).toUpperCase();
                } catch (e) {
                  return "U";
                }
              })()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="mb-2">{renderFeedContent()}</div>
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(feedItem.created_at || new Date()))}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${isLiked ? "text-red-500" : ""}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
            <span>{likesCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={loadComments}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{feedItem.comments?.length || 0}</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.users?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(
                        comment.users?.full_name?.substring(0, 2) || "U"
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {comment.users?.full_name || "Anonymous"}
                    </p>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(
                        new Date(comment.created_at || new Date()),
                      )}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                No comments yet
              </p>
            )}

            <div className="flex items-center space-x-2 mt-4">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[60px]"
              />
              <Button size="icon" onClick={handleComment}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
