// Shared helpers for the campaign "Cerita program" rich-text field.
// The DB column stays `story_paragraphs text[]`: legacy rows hold one plain-text
// string per paragraph, new rows hold a single HTML string authored in the editor.

// Tailwind arbitrary-child selectors so stored HTML looks the same in the editor
// and on the public page without needing the typography plugin.
export const STORY_PROSE_CLASS =
  "text-base leading-relaxed text-brand-text-body text-pretty " +
  "[&_p]:mb-3.5 [&_p:last-child]:mb-0 sm:[&_p]:text-lg " +
  "[&_strong]:font-bold [&_em]:italic [&_u]:underline " +
  "[&_a]:font-medium [&_a]:text-brand-blue [&_a]:underline " +
  "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-navy " +
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-brand-navy " +
  "[&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-border [&_blockquote]:pl-4 [&_blockquote]:italic";

const HTML_RE = /<[a-z][\s\S]*>/i;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Turn a stored `story_paragraphs` array into one HTML string for rendering / editing.
// HTML entries pass through; legacy plain-text entries are escaped and wrapped in <p>.
export function storyParagraphsToHtml(paragraphs: string[]): string {
  if (!paragraphs || paragraphs.length === 0) {
    return "";
  }
  return paragraphs
    .map((paragraph) =>
      HTML_RE.test(paragraph) ? paragraph : `<p>${escapeHtml(paragraph)}</p>`,
    )
    .join("");
}
