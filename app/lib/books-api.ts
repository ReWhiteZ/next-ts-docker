import type { Book } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getBooks(): Promise<Book[]> {
  if (!API_BASE_URL) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const response = await fetch(`${API_BASE_URL}/books`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`โหลดรายการหนังสือไม่สำเร็จ (HTTP ${response.status})`);
  }

  return response.json() as Promise<Book[]>;
}

export async function createBook(book: {
  title: string;
  author: string;
  publishedAt?: string;
}): Promise<Book> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const response = await fetch(`${apiBaseUrl}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error(`สร้างหนังสือไม่สำเร็จ (HTTP ${response.status})`);
  }

  return response.json() as Promise<Book>;
}

export async function uploadBookCover(
  bookId: number,
  file: File,
): Promise<Book> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}/books/${bookId}/cover`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`อัปโหลดรูปปกไม่สำเร็จ (HTTP ${response.status})`);
  }

  return response.json() as Promise<Book>;
}

export async function updateBook(
  bookId: number,
  updates: {
    title?: string;
    author?: string;
    publishedAt?: string;
  },
): Promise<Book> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const response = await fetch(`${apiBaseUrl}/books/${bookId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`แก้ไขหนังสือไม่สำเร็จ (HTTP ${response.status})`);
  }

  return response.json() as Promise<Book>;
}

export async function createReview(
  bookId: number,
  rating: number,
  content: string,
): Promise<void> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const response = await fetch(
    `${apiBaseUrl}/books/${bookId}/reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating, content }),
    },
  );

  if (!response.ok) {
    throw new Error(`ส่งรีวิวไม่สำเร็จ (HTTP ${response.status})`);
  }
}

export async function deleteBook(bookId: number): Promise<void> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const response = await fetch(`${apiBaseUrl}/books/${bookId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`ลบหนังสือไม่สำเร็จ (HTTP ${response.status})`);
  }
}