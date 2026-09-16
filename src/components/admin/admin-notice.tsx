import { CircleAlert, CircleCheck } from "lucide-react";

function AdminNotice({
  error,
  success,
}: {
  error?: string | string[];
  success?: string | string[];
}) {
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const successMessage = Array.isArray(success) ? success[0] : success;

  if (!errorMessage && !successMessage) {
    return null;
  }

  if (errorMessage) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-brand-red/20 bg-brand-tint-red px-4 py-3 text-sm font-medium text-brand-red" role="alert">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
      <CircleCheck className="mt-0.5 size-4 shrink-0" />
      <span>{successMessage}</span>
    </div>
  );
}

export { AdminNotice };
