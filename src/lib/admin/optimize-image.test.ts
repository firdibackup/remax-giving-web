// Run: node --experimental-strip-types --test src/lib/admin/optimize-image.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { optimizePublicImage } from "./optimize-image.ts";

test("resizes and auto-orients photos without cropping, stripping EXIF", async () => {
  const input = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "red" } })
    .jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const output = await optimizePublicImage(input);
  assert.ok(output);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1280);
  assert.equal(metadata.height, 1920);
  assert.equal(metadata.exif, undefined);
});

test("keeps transparency and never enlarges small images", async () => {
  const input = await sharp({ create: { width: 80, height: 40, channels: 4, background: { r: 20, g: 30, b: 40, alpha: 0.5 } } })
    .png().withMetadata().toBuffer();
  const output = await optimizePublicImage(input);
  assert.ok(output);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 80);
  assert.equal(metadata.height, 40);
  assert.equal(metadata.hasAlpha, true);
});

test("keeps the original when conversion does not reduce its size", async () => {
  const input = await sharp({ create: { width: 80, height: 40, channels: 3, background: "red" } })
    .webp({ quality: 1 }).toBuffer();
  assert.equal(await optimizePublicImage(input), null);
});

test("preserves animated uploads instead of flattening them", async () => {
  const pixels = Buffer.concat([Buffer.alloc(20 * 20 * 3, 0), Buffer.alloc(20 * 20 * 3, 255)]);
  const input = await sharp(pixels, { raw: { width: 20, height: 40, channels: 3, pageHeight: 20 } })
    .webp({ delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(input).metadata()).pages, 2);
  assert.equal(await optimizePublicImage(input), null);
});

test("rejects corrupt files and images above the pixel limit", async () => {
  await assert.rejects(optimizePublicImage(Buffer.from("not an image")));
  const oversized = await sharp({ create: { width: 8000, height: 7000, channels: 3, background: "red" } })
    .png().toBuffer();
  await assert.rejects(optimizePublicImage(oversized), /pixel limit/i);
});
