import { FolderOpen } from "lucide-react";

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <FolderOpen className="mx-auto size-8 text-brand-text-body/45" />
      <p className="mt-3 font-bold text-brand-navy">{title}</p>
      <p className="mt-1 text-sm text-brand-text-body">{description}</p>
    </div>
  );
}

export { EmptyState };
