export type Review = {
  id: number;
  rating: number;
  content: string;
  bookId: number;
};

export type Book = {
  id: number;
  title: string;
  author: string;
  publishedAt: string;
  coverUrl: string | null;
  reviews: Review[];
};