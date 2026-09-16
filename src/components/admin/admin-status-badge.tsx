import { Badge } from "@/components/ui/badge";
import { statusPresentation } from "@/lib/status";

function AdminStatusBadge<Status extends string>({
  status,
  map,
}: {
  status: Status;
  map: Record<Status, { label: string; className: string }>;
}) {
  const presentation = statusPresentation(map, status);

  return (
    <Badge variant="outline" className={presentation.className}>
      {presentation.label}
    </Badge>
  );
}

export { AdminStatusBadge };
