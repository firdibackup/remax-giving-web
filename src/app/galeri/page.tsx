import { GalleryDirectory } from "@/components/gallery-directory";
import { getPublicGallery } from "@/lib/public-data";

export default async function GalleryPage() {
  const { media, albums } = await getPublicGallery();
  return <GalleryDirectory media={media} albums={albums} />;
}
