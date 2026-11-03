export type Category = {
  id: number;
  name: string;
  description: string;
  books: Book[] | null;
};

export type Book = {
  id: number;
  title: string;
  author: string;
  publishedAt: string;
  coverUrl: string | null;
  categoryid: number | null;
  categories: Category | null;
};