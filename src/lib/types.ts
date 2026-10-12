export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'admin';
  course: string | null;
  semester: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type PostType = 'general' | 'doubt' | 'seminar';

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  content: string;
  file_url: string | null;
  file_type: string | null;
  is_solved: boolean;
  solved_comment_id: string | null;
  created_at: string;
  author?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  created_at: string;
  author?: Profile;
}

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  status: 'available' | 'sold';
  created_at: string;
  author?: Profile;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}
