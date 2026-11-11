// Run with Node >= 22.6: node --experimental-strip-types scripts/optimize-local-images.mjs
import { readFile, writeFile } from "node:fs/promises";
import { optimizePublicImage } from "../src/lib/admin/optimize-image.ts";

// Originals remain available; new URLs also avoid stale image-optimizer caches.
for (let index = 1; index <= 7; index++) {
  const stem = `public/photos/community-${String(index).padStart(2, "0")}-web`;
  const input = await readFile(`${stem}.${index <= 3 ? "jpg" : "JPG"}`);
  const output = await optimizePublicImage(input);
  if (!output) throw new Error(`No optimized WebP generated for ${stem}`);
  await writeFile(`${stem}.webp`, output);
  console.log(`${stem}: ${input.length} -> ${output.length} bytes`);
}
