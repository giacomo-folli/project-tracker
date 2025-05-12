"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";
import { useSearchParams } from "next/navigation";

type ProfileFormProps = {
  user: any;
  profile: any;
};

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || user?.user_metadata?.full_name || "",
    email: user?.email || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      <form action={updateProfileAction} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email address"
          />
        </div>

        <div className="flex justify-end">
          <SubmitButton>Update Profile</SubmitButton>
        </div>
      </form>
    </div>
  );
}
