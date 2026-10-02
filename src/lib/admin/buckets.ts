// Shared by server code and client upload fields; keep free of server-only imports.
export const BUCKETS = {
  publicMedia: "home-of-giving-public-media",
  publicReports: "home-of-giving-public-reports",
  privateReports: "home-of-giving-private-reports",
  donationEvidence: "home-of-giving-private-donation-evidence",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export const bucketLimits: Record<BucketName, { maxBytes: number; mimeTypes: string[] }> = {
  [BUCKETS.publicMedia]: {
    maxBytes: 26_214_400,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"],
  },
  [BUCKETS.publicReports]: {
    maxBytes: 26_214_400,
    mimeTypes: ["application/pdf"],
  },
  [BUCKETS.privateReports]: {
    maxBytes: 26_214_400,
    mimeTypes: ["application/pdf"],
  },
  [BUCKETS.donationEvidence]: {
    maxBytes: 10_485_760,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
};

export const documentationMaxBytes = 5 * 1024 * 1024;

// Each chunk is one request through the remax.co.id reverse proxy, which may
// cap bodies at 1 MB; leave room for the multipart envelope.
export const uploadChunkBytes = 750 * 1024;
