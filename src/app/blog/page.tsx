import { BlogDirectory } from "@/components/blog-directory";
import { getPublicBlogPosts } from "@/lib/public-data";

export default async function BlogPage() {
  const posts = await getPublicBlogPosts();
  return <BlogDirectory posts={posts} />;
}
