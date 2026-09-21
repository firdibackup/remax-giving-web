"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
} from "lucide-react";
import { STORY_PROSE_CLASS } from "@/lib/story";

type ToolButton = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
};

const buttons: ToolButton[] = [
  { icon: Bold, label: "Tebal", run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold") },
  { icon: Italic, label: "Miring", run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic") },
  { icon: Underline, label: "Garis bawah", run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive("underline") },
  { icon: Heading2, label: "Sub-judul", run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive("heading", { level: 2 }) },
  { icon: Heading3, label: "Sub-judul kecil", run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive("heading", { level: 3 }) },
  { icon: List, label: "Daftar poin", run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
  { icon: ListOrdered, label: "Daftar bernomor", run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
  { icon: Quote, label: "Kutipan", run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
];

function setLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Tautan (URL):", previous ?? "https://");
  if (url === null) return;
  if (url.trim() === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}

function RichTextEditor({ name, initialHTML }: { name: string; initialHTML: string }) {
  const [html, setHtml] = useState(initialHTML);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
    ],
    content: initialHTML || "<p></p>",
    immediatelyRender: false, // required: avoids SSR hydration mismatch in Next
    editorProps: {
      attributes: {
        class: `${STORY_PROSE_CLASS} min-h-[220px] px-4 py-3 focus:outline-none`,
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white focus-within:ring-2 focus-within:ring-brand-blue/40">
      <div className="flex flex-wrap items-center gap-1 border-b border-brand-border bg-brand-bg-soft px-2 py-1.5">
        {buttons.map(({ icon: Icon, label, run, active }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={editor ? active?.(editor) ?? false : false}
            disabled={!editor}
            onClick={() => editor && run(editor)}
            className={`grid size-8 place-items-center rounded-md text-brand-navy transition-colors hover:bg-white ${
              editor && active?.(editor) ? "bg-white ring-1 ring-brand-blue/40 text-brand-blue" : ""
            }`}
          >
            <Icon className="size-4" />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-brand-border" />
        <button
          type="button"
          title="Tambah tautan"
          aria-label="Tambah tautan"
          disabled={!editor}
          onClick={() => editor && setLink(editor)}
          className={`grid size-8 place-items-center rounded-md text-brand-navy transition-colors hover:bg-white ${
            editor?.isActive("link") ? "bg-white ring-1 ring-brand-blue/40 text-brand-blue" : ""
          }`}
        >
          <Link2 className="size-4" />
        </button>
        <button
          type="button"
          title="Hapus tautan"
          aria-label="Hapus tautan"
          disabled={!editor || !editor.isActive("link")}
          onClick={() => editor?.chain().focus().unsetLink().run()}
          className="grid size-8 place-items-center rounded-md text-brand-navy transition-colors hover:bg-white disabled:opacity-40"
        >
          <Link2Off className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-brand-border" />
        <button
          type="button"
          title="Urungkan"
          aria-label="Urungkan"
          disabled={!editor || !editor.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
          className="grid size-8 place-items-center rounded-md text-brand-navy transition-colors hover:bg-white disabled:opacity-40"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          title="Ulangi"
          aria-label="Ulangi"
          disabled={!editor || !editor.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
          className="grid size-8 place-items-center rounded-md text-brand-navy transition-colors hover:bg-white disabled:opacity-40"
        >
          <Redo2 className="size-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

export { RichTextEditor };
