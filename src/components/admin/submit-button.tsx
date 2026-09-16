"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function SubmitButton({
  children,
  pendingLabel = "Menyimpan...",
  className,
  variant = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className={className} variant={variant}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

export { SubmitButton };
