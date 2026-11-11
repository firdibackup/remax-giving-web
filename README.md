This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

### Photo optimization

- Public photo uploads produce a WebP display copy (quality 80, longest side at most 1920 px), with EXIF orientation applied and no upscaling. Animated images and already-small files that would grow retain their original format.
- Original converted uploads are retained under the same folder's `originals/` subdirectory. These are recovery copies in the **public** media bucket; they are not private archives and are not removed when the display copy is deleted.
- Videos, documents, and donation evidence bypass photo compression.
- Regenerate the local display photos with `node --experimental-strip-types scripts/optimize-local-images.mjs` (Node >= 22.6). Original JPEG files are preserved.
- Existing Storage images need to be re-uploaded through the admin forms to produce optimized copies and update their references. Deploying this code alone does not rewrite existing Storage objects.
- Test compression with `node --experimental-strip-types --test src/lib/admin/optimize-image.test.ts`.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
