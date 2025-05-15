"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormMessage } from "@/components/form-message";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../supabase/client";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ProfilePictureUploadProps = {
  user: any;
  profile: any;
};

export default function ProfilePictureUpload({
  user,
  profile,
}: ProfilePictureUploadProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Upload the file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      const avatarUrl = publicUrlData.publicUrl;

      // Update the user profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update the user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      setAvatarUrl(avatarUrl);
      router.refresh();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      router.push("/dashboard/profile?error=Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;

    try {
      setIsDeleting(true);

      // Extract the file name from the URL
      const fileName = avatarUrl.split("/").pop();
      if (fileName) {
        // Delete the file from storage
        const { error: deleteStorageError } = await supabase.storage
          .from("avatars")
          .remove([fileName]);

        if (deleteStorageError) {
          console.error("Error deleting from storage:", deleteStorageError);
        }
      }

      // Update the user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update the user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      setAvatarUrl(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting avatar:", error);
      router.push("/dashboard/profile?error=Failed to remove profile picture");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = () => {
    const name =
      profile?.full_name || user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      {(success || error) && (
        <FormMessage
          message={success ? { success } : error ? { error } : { message: "" }}
        />
      )}

      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-32 w-32">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
        </Avatar>

        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload New Picture</span>
              </>
            )}
          </Button>

          {avatarUrl && (
            <Button
              variant="destructive"
              onClick={handleDeleteAvatar}
              disabled={isUploading || isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </>
              )}
            </Button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <p className="text-sm text-muted-foreground text-center max-w-md">
          Upload a profile picture in JPG, PNG or GIF format. The image will be
          resized to fit in a circle.
        </p>
      </div>
    </div>
  );
}
