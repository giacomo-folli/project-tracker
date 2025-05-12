"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePersonaAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";
import { useSearchParams } from "next/navigation";

type PersonaFormProps = {
  user: any;
  profile: any;
};

export default function PersonaForm({ user, profile }: PersonaFormProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [formData, setFormData] = useState({
    bio: profile?.bio || "",
    passions: profile?.passions || "",
    workProjects: profile?.work_projects || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {(success || error) && (
        <FormMessage
          message={success ? { success } : error ? { error } : { message: "" }}
        />
      )}

      <form action={updatePersonaAction} className="space-y-6">
        <div className="grid gap-3">
          <Label htmlFor="bio" className="text-base font-medium">
            About Me
          </Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Share a brief description about yourself..."
            className="min-h-[120px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Write a short bio that describes who you are.
          </p>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="passions" className="text-base font-medium">
            Passions & Interests
          </Label>
          <Textarea
            id="passions"
            name="passions"
            value={formData.passions}
            onChange={handleChange}
            placeholder="What are you passionate about? List your interests and hobbies..."
            className="min-h-[100px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Share your interests, hobbies, and what motivates you.
          </p>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="workProjects" className="text-base font-medium">
            Work & Projects
          </Label>
          <Textarea
            id="workProjects"
            name="workProjects"
            value={formData.workProjects}
            onChange={handleChange}
            placeholder="Describe your work, career, or notable projects..."
            className="min-h-[100px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Highlight your professional background and significant projects.
          </p>
        </div>

        <div className="flex justify-end">
          <SubmitButton>Save Persona</SubmitButton>
        </div>
      </form>
    </div>
  );
}
