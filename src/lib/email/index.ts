import "server-only";

export type EmailAddress = {
  email: string;
  name?: string;
};

export type OutboundEmail = {
  to: EmailAddress[];
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailAddress;
};

export type EmailDeliveryResult = {
  id: string;
};

export interface EmailTransport {
  send(message: OutboundEmail): Promise<EmailDeliveryResult>;
}

export type BrandEmailRow = {
  label: string;
  value: string;
};

export type BrandEmailInput = {
  preview: string;
  eyebrow: string;
  title: string;
  greeting?: string;
  paragraphs: string[];
  rows?: BrandEmailRow[];
  action?: {
    label: string;
    url: string;
  };
  footnote?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function renderBrandEmail(input: BrandEmailInput): Pick<OutboundEmail, "html" | "text"> {
  const greeting = input.greeting ? `<p style="margin:0 0 18px;color:#062E61;font-size:16px;font-weight:700;line-height:1.6">${escapeHtml(input.greeting)}</p>` : "";
  const paragraphs = input.paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#4B5C73;font-size:15px;line-height:1.75">${escapeHtml(paragraph)}</p>`)
    .join("");
  const rows = input.rows?.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-collapse:collapse;border:1px solid #DCE5F0;border-radius:12px">${input.rows
        .map(
          (row) =>
            `<tr><td style="border-bottom:1px solid #DCE5F0;padding:12px 16px;color:#66758A;font-size:13px;line-height:1.5">${escapeHtml(row.label)}</td><td align="right" style="border-bottom:1px solid #DCE5F0;padding:12px 16px;color:#062E61;font-size:13px;font-weight:700;line-height:1.5">${escapeHtml(row.value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const actionUrl = input.action ? safeUrl(input.action.url) : null;
  const action = input.action && actionUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0"><tr><td style="border-radius:10px;background:#E21B2D"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:13px 22px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none">${escapeHtml(input.action.label)}</a></td></tr></table>`
    : "";
  const footnote = input.footnote
    ? `<p style="margin:24px 0 0;border-top:1px solid #DCE5F0;padding-top:18px;color:#66758A;font-size:12px;line-height:1.7">${escapeHtml(input.footnote)}</p>`
    : "";

  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;background:#F3F6FA;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preview)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F6FA"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;overflow:hidden;border:1px solid #DCE5F0;border-radius:18px;background:#FFFFFF"><tr><td style="background:#062E61;padding:24px 28px"><div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:-.3px">REMAX Home of Giving</div><div style="margin-top:5px;color:#BFD4F2;font-size:12px">Giving Starts From Home</div></td></tr><tr><td style="padding:32px 28px"><div style="margin-bottom:10px;color:#E21B2D;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase">${escapeHtml(input.eyebrow)}</div><h1 style="margin:0 0 22px;color:#062E61;font-size:28px;line-height:1.2;letter-spacing:-.7px">${escapeHtml(input.title)}</h1>${greeting}${paragraphs}${rows}${action}${footnote}</td></tr><tr><td style="background:#F3F6FA;padding:20px 28px;color:#66758A;font-size:11px;line-height:1.7">Email ini dikirim oleh REMAX Home of Giving. Jangan membalas email ini jika alamat pengirim tidak mendukung balasan.</td></tr></table></td></tr></table></body></html>`;

  const textRows = input.rows?.map((row) => `${row.label}: ${row.value}`).join("\n") || "";
  const textAction = input.action && actionUrl ? `${input.action.label}: ${actionUrl}` : "";
  const text = [
    "REMAX Home of Giving",
    input.eyebrow.toUpperCase(),
    input.title,
    input.greeting,
    ...input.paragraphs,
    textRows,
    textAction,
    input.footnote,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
}

export async function deliverEmail(
  transport: EmailTransport,
  message: Omit<OutboundEmail, "html" | "text">,
  content: BrandEmailInput,
): Promise<EmailDeliveryResult> {
  const rendered = renderBrandEmail(content);
  return transport.send({ ...message, ...rendered });
}
