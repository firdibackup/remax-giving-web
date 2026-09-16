export type CampaignStatus = "berjalan" | "tuntas";

export interface Campaign {
  slug: string;
  image: string;
  imagePos?: string;
  title: string;
  status: CampaignStatus;
  raised: string;
  target: string;
  raisedAmount: number;
  targetAmount: number;
  percent: number;
  donorCount: number;
  meta: string;
  cycle?: string;
  location?: string;
  recipient?: string;
  completedDate?: string;
}

export interface Donation {
  date: string;
  name: string;
  project: string;
  projectTag: string;
  amount: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  imagePos: string;
  author?: string;
  readTime?: string;
  featured?: boolean;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  pos: string;
  album: string;
  caption: string;
  meta: string;
  span?: "wide" | "tall";
}

export interface GalleryAlbum {
  slug: string;
  title: string;
  image: string;
  imagePos: string;
  photoCount: number;
  period: string;
  description: string;
}

export interface ProjectDonor {
  name: string;
  date: string;
  amount: string;
}
