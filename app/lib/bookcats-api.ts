import type { Book } from "./bookcats-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getBooks(): Promise<Book[]> {
  if (!API_BASE_URL) {
    throw new Error("ไม่พบ NEXT_PUBLIC_API_BASE_URL ในไฟล์ environment");
  }

  const response = await fetch(`${API_BASE_URL}/bookcats`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`โหลดรายการหนังสือไม่สำเร็จ (HTTP ${response.status})`);
  }

  return response.json() as Promise<Book[]>;
}