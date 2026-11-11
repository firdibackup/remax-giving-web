import sharp from "sharp";

// Public display photos only; documents and donation evidence keep their originals.
export async function optimizePublicImage(input: Buffer): Promise<Buffer | null> {
  const image = sharp(input, { limitInputPixels: 50_000_000 });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp", "heif", "avif"].includes(metadata.format || "")) {
    throw new Error("Format gambar tidak didukung.");
  }
  // Preserve animation rather than silently flattening it to the first frame.
  if ((metadata.pages ?? 1) > 1) return null;

  const output = await image
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .timeout({ seconds: 15 })
    .toBuffer();

  const needsResize = Math.max(metadata.width ?? 0, metadata.height ?? 0) > 1920;
  return needsResize || output.length < input.length ? output : null;
}
