"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";

type ShareLinkButtonProps = {
  shareUrl: string;
};

export default function ShareLinkButton({ shareUrl }: ShareLinkButtonProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  return (
    <Button variant="secondary" onClick={handleCopyLink}>
      <LinkIcon className="mr-2 h-4 w-4" /> Copy Share Link
    </Button>
  );
}
