"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  variant = "outline",
}: {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Memproses..." : children}
    </Button>
  );
}

export { ConfirmSubmitButton };
