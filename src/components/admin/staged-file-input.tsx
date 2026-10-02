"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { bucketLimits, type BucketName } from "@/lib/admin/buckets";
import { uploadInChunks } from "@/lib/admin/chunked-upload";
import { cn } from "@/lib/utils";

// File field that uploads as soon as a file is picked and submits only the
// stored path under `name`, so the form request itself stays tiny. The form
// cannot be submitted while an upload is running or has failed.
function StagedFileInput({
  id,
  name,
  bucket,
  folder,
  accept = bucketLimits[bucket].mimeTypes,
  maxBytes = bucketLimits[bucket].maxBytes,
  required,
}: {
  id: string;
  name: string;
  bucket: BucketName;
  folder: string;
  accept?: string[];
  maxBytes?: number;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    const clear = () => {
      input?.setCustomValidity("");
      setPath("");
      setStatus(null);
    };

    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, []);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const isCurrent = () => input.files?.[0] === file;
    const fail = (text: string) => {
      input.setCustomValidity(text);
      setStatus({ error: true, text });
    };

    // ponytail: a replaced or abandoned upload stays in storage unreferenced.
    setPath("");

    if (!file) {
      input.setCustomValidity("");
      setStatus(null);
      return;
    }

    if (!accept.includes(file.type)) {
      return fail("Tipe berkas tidak didukung.");
    }

    if (file.size === 0 || file.size > maxBytes) {
      return fail(
        `Ukuran berkas harus di atas 0 dan maksimal ${Math.floor(maxBytes / 1_048_576)} MB.`,
      );
    }

    input.setCustomValidity("Tunggu hingga unggahan selesai.");
    setStatus({ error: false, text: "Mengunggah 0%..." });

    const result = await uploadInChunks(file, bucket, folder, (fraction) => {
      if (isCurrent()) {
        setStatus({
          error: false,
          text: `Mengunggah ${Math.round(fraction * 100)}%...`,
        });
      }
    });

    if (!isCurrent()) {
      return;
    }

    if ("error" in result) {
      return fail(result.error);
    }

    input.setCustomValidity("");
    setPath(result.path);
    setStatus({ error: false, text: "Berkas terunggah." });
  }

  return (
    <div className="space-y-1.5">
      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept.join(",")}
        required={required}
        onChange={handleChange}
      />
      <input type="hidden" name={name} value={path} />
      {status && (
        <p
          aria-live="polite"
          className={cn(
            "text-xs",
            status.error ? "text-brand-red" : "text-brand-text-body",
          )}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}

export { StagedFileInput };
