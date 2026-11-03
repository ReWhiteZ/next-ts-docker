"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import {
  createBook,
  updateBook,
  uploadBookCover,
  createReview,
  getBooks,
  deleteBook,
} from "./lib/books-api";
import type { Book } from "./lib/bookcats-types";
import Image from "next/image";

function getCoverImageSrc(coverUrl: string | null): string | null {
  if (!coverUrl) return null;

  if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
    return coverUrl;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  return apiBaseUrl ? new URL(coverUrl, apiBaseUrl).toString() : null;
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [submittingBookId, setSubmittingBookId] = useState<number | null>(null);
  const [reviewError, setReviewError] = useState<{
    bookId: number;
    message: string;
  } | null>(null);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [createBookError, setCreateBookError] = useState("");
  const [uploadingBookId, setUploadingBookId] = useState<number | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<{
    bookId: number;
    message: string;
  } | null>(null);

  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [updatingBookId, setUpdatingBookId] = useState<number | null>(null);
  const [updateBookError, setUpdateBookError] = useState<{
    bookId: number;
    message: string;
  } | null>(null);

  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [deleteBookError, setDeleteBookError] = useState<{
    bookId: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    let isActive = true;

    getBooks()
      .then((data) => {
        if (isActive) setBooks(data);
      })
      .catch((error: unknown) => {
        if (!isActive) return;

        setError(
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการโหลดหนังสือ",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleReviewSubmit(
    event: SubmitEvent<HTMLFormElement>,
    bookId: number,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const rating = Number(formData.get("rating"));
    const content = String(formData.get("content") ?? "").trim();

    setReviewError(null);
    setSubmittingBookId(bookId);

    try {
      await createReview(bookId, rating, content);
      setBooks(await getBooks());
      form.reset();
    } catch (error: unknown) {
      setReviewError({
        bookId,
        message: error instanceof Error ? error.message : "ส่งรีวิวไม่สำเร็จ",
      });
    } finally {
      setSubmittingBookId(null);
    }
  }

  async function handleCreateBookSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const author = String(formData.get("author") ?? "").trim();
    const publishedAt = String(formData.get("publishedAt") ?? "");
    const selectedFile = formData.get("cover");
    const coverFile =
      selectedFile instanceof File && selectedFile.size > 0
        ? selectedFile
        : null;

    setCreateBookError("");

    if (coverFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(coverFile.type)) {
        setCreateBookError("รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP");
        return;
      }

      if (coverFile.size > 5 * 1024 * 1024) {
        setCreateBookError("ไฟล์รูปปกต้องมีขนาดไม่เกิน 5 MB");
        return;
      }
    }

    setIsCreatingBook(true);

    try {
      const createdBook = await createBook({
        title,
        author,
        ...(publishedAt ? { publishedAt } : {}),
      });

      if (coverFile) {
        try {
          const bookWithCover = await uploadBookCover(
            createdBook.id,
            coverFile,
          );

          setBooks((currentBooks) =>
            [
              ...currentBooks.filter((book) => book.id !== bookWithCover.id),
              bookWithCover,
            ].sort((a, b) => a.id - b.id),
          );
        } catch (error: unknown) {
          setBooks((currentBooks) =>
            [
              ...currentBooks.filter((book) => book.id !== createdBook.id),
              createdBook,
            ].sort((a, b) => a.id - b.id),
          );
          setCreateBookError(
            `สร้างหนังสือแล้ว แต่อัปโหลดรูปไม่สำเร็จ: ${
              error instanceof Error ? error.message : "กรุณาลองอัปโหลดอีกครั้ง"
            }`,
          );
          form.reset();
          return;
        }
      } else {
        setBooks((currentBooks) =>
          [...currentBooks, createdBook].sort((a, b) => a.id - b.id),
        );
      }

      form.reset();
    } catch (error: unknown) {
      setCreateBookError(
        error instanceof Error ? error.message : "สร้างหนังสือไม่สำเร็จ",
      );
    } finally {
      setIsCreatingBook(false);
    }
  }

  async function handleCoverUploadSubmit(
    event: SubmitEvent<HTMLFormElement>,
    bookId: number,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    setCoverUploadError(null);

    if (!(file instanceof File) || file.size === 0) {
      setCoverUploadError({
        bookId,
        message: "Please choose an image file.",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setCoverUploadError({
        bookId,
        message: "รองรับเฉพาะ JPEG, PNG หรือ WebP",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCoverUploadError({
        bookId,
        message: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB",
      });
      return;
    }

    setUploadingBookId(bookId);

    try {
      await uploadBookCover(bookId, file);
      setBooks(await getBooks());
      form.reset();
    } catch (error: unknown) {
      setCoverUploadError({
        bookId,
        message:
          error instanceof Error ? error.message : "อัปโหลดรูปปกไม่สำเร็จ",
      });
    } finally {
      setUploadingBookId(null);
    }
  }

  async function handleUpdateBookSubmit(
    event: SubmitEvent<HTMLFormElement>,
    bookId: number,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const author = String(formData.get("author") ?? "").trim();
    const publishedAt = String(formData.get("publishedAt") ?? "");

    setUpdateBookError(null);
    setUpdatingBookId(bookId);

    try {
      const updatedBook = await updateBook(bookId, {
        title,
        author,
        publishedAt,
      });

      setBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.id === updatedBook.id ? updatedBook : book,
        ),
      );
      setEditingBookId(null);
    } catch (error: unknown) {
      setUpdateBookError({
        bookId,
        message:
          error instanceof Error ? error.message : "แก้ไขหนังสือไม่สำเร็จ",
      });
    } finally {
      setUpdatingBookId(null);
    }
  }

  async function handleDeleteBook(bookId: number, title: string) {
    const confirmed = window.confirm(
      `ยืนยันลบหนังสือ “${title}” ใช่ไหม? / Delete “${title}”?`,
    );

    if (!confirmed) return;

    setDeleteBookError(null);
    setDeletingBookId(bookId);

    try {
      await deleteBook(bookId);
      setBooks((currentBooks) =>
        currentBooks.filter((book) => book.id !== bookId),
      );

      if (editingBookId === bookId) {
        setEditingBookId(null);
      }
    } catch (error: unknown) {
      setDeleteBookError({
        bookId,
        message: error instanceof Error ? error.message : "ลบหนังสือไม่สำเร็จ",
      });
    } finally {
      setDeletingBookId(null);
    }
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredBooks = books.filter((book) => {
    const searchableText = `${book.title} ${book.author}`.toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-screen-2xl px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="mb-10">
        <p className="text-sm font-medium text-slate-500">
          Book Reviews
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          ค้นหาหนังสือ
        </h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.8fr)] lg:items-start">
        <section
          aria-labelledby="create-book-heading"
          className="order-1 mb-10 border-y border-slate-200 py-6 lg:order-2 lg:mb-0 lg:rounded-xl lg:border lg:bg-white lg:p-6"
        >
          <h2
            id="create-book-heading"
            className="text-xl font-semibold text-slate-900"
          >
            Add a book
          </h2>

          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={handleCreateBookSubmit}
          >
            <div>
              <label
                htmlFor="new-book-title"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Title
              </label>
              <input
                id="new-book-title"
                name="title"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="new-book-author"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Author
              </label>
              <input
                id="new-book-author"
                name="author"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="new-book-published-at"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                วันที่ตีพิมพ์ (optional)
              </label>
              <input
                id="new-book-published-at"
                name="publishedAt"
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="new-book-cover"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                รูปปก (optional)
              </label>
              <input
                id="new-book-cover"
                name="cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-400 bg-slate-50 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:border-0 file:border-r file:border-slate-300 file:bg-white file:px-4 file:py-3 file:font-medium file:text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
              />
              <p className="mt-2 text-xs text-slate-500">
                เลือก JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isCreatingBook}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingBook
                  ? "กำลังบันทึก… / Saving…"
                  : "เพิ่มหนังสือ / Add book"}
              </button>
            </div>

            {createBookError && (
              <p role="alert" className="text-sm text-red-700 sm:col-span-2">
                {createBookError}
              </p>
            )}
          </form>
        </section>

        <section
          aria-label="รายการหนังสือ"
          className="order-2 min-w-0 lg:order-1"
        >
          <label
            htmlFor="book-search"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            ค้นหาหนังสือหรือผู้เขียน
          </label>
          <input
            id="book-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="เช่น Clean Code"
            className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
          />

          {isLoading && (
            <p role="status" className="text-slate-600">
              Loading books…
            </p>
          )}

          {!isLoading && !error && books.length === 0 && (
            <div
              role="status"
              className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center"
            >
              <h2 className="text-lg font-medium text-slate-900">
                ยังไม่มีหนังสือในระบบ
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                เพิ่มหนังสือได้จากแผงจัดการ
                panel.
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            books.length > 0 &&
            filteredBooks.length === 0 && (
              <p className="text-slate-600">
                ไม่พบหนังสือที่ค้นหา
              </p>
            )}

          {!isLoading && !error && books.length > 0 && (
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {filteredBooks.map((book) => (
                <li key={book.id} className="py-6">
                  <article className="grid gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[10rem_minmax(0,1.1fr)_minmax(17rem,0.9fr)]">
                    <div className="min-w-0">
                      {getCoverImageSrc(book.coverUrl) ? (
                        <Image
                          src={getCoverImageSrc(book.coverUrl)!}
                          alt={`ปกหนังสือ ${book.title}`}
                          width={160}
                          height={240}
                          unoptimized
                          className="aspect-2/3 h-auto w-full max-w-40 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          aria-label="ไม่มีรูปปกหนังสือ"
                          className="flex aspect-2/3 w-full max-w-40 items-center justify-center rounded-lg bg-slate-100 text-center text-sm text-slate-500"
                        >
                          ไม่มีรูปปก
                        </div>
                      )}

                      <div className="mt-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {book.title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {book.author}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUpdateBookError(null);
                              setEditingBookId(
                                editingBookId === book.id ? null : book.id,
                              );
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {editingBookId === book.id
                              ? "Close"
                              : "Edit"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteBook(book.id, book.title)
                            }
                            disabled={deletingBookId === book.id}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {deletingBookId === book.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        </div>

                        {deleteBookError?.bookId === book.id && (
                          <p role="alert" className="mt-2 text-sm text-red-700">
                            {deleteBookError.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <section
                      aria-label={`รีวิวหนังสือ ${book.title}`}
                      className="min-w-0"
                    >
                      <p className="text-sm font-medium text-slate-700">
                        {book.reviews.length} รีวิว /{" "}
                        {book.reviews.length === 1 ? "review" : "reviews"}
                      </p>

                      {book.reviews.length > 0 ? (
                        <ul className="mt-3 grid gap-3 md:grid-cols-2">
                          {book.reviews.map((review) => (
                            <li
                              key={review.id}
                              className="rounded-lg bg-slate-50 p-4"
                            >
                              <p
                                className="text-sm font-semibold text-slate-700"
                                aria-label={`${review.rating} จาก 5 คะแนน`}
                              >
                                {review.rating}/5
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {review.content}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                          ยังไม่มีรีวิว
                        </p>
                      )}

                      <form
                        className="mt-5 space-y-3 border-t border-slate-200 pt-4"
                        onSubmit={(event) => handleReviewSubmit(event, book.id)}
                      >
                        <h3 className="text-sm font-semibold text-slate-800">
                          เขียนรีวิว
                        </h3>

                        <div>
                          <label
                            htmlFor={`rating-${book.id}`}
                            className="mb-1 block text-sm text-slate-700"
                          >
                            คะแนน
                          </label>
                          <select
                            id={`rating-${book.id}`}
                            name="rating"
                            required
                            defaultValue=""
                            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                          >
                            <option value="" disabled>
                              เลือกคะแนน
                            </option>
                            {[5, 4, 3, 2, 1].map((rating) => (
                              <option key={rating} value={rating}>
                                {rating}/5
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`content-${book.id}`}
                            className="mb-1 block text-sm text-slate-700"
                          >
                             Review
                          </label>
                          <textarea
                            id={`content-${book.id}`}
                            name="content"
                            required
                            rows={3}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                          />
                        </div>

                        {reviewError?.bookId === book.id && (
                          <p role="alert" className="text-sm text-red-700">
                            {reviewError.message}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={submittingBookId === book.id}
                          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingBookId === book.id
                            ? "Submitting…"
                            : "Submit review"}
                        </button>
                      </form>
                    </section>

                    <aside className="min-w-0 space-y-5 md:col-span-2 xl:col-span-1">
                      {editingBookId === book.id && (
                        <form
                          className="space-y-3 rounded-lg bg-slate-50 p-4"
                          onSubmit={(event) =>
                            handleUpdateBookSubmit(event, book.id)
                          }
                        >
                          <h3 className="text-sm font-semibold text-slate-800">
                            Edit book
                          </h3>

                          <div>
                            <label
                              htmlFor={`edit-title-${book.id}`}
                              className="mb-1 block text-sm text-slate-700"
                            >
                              Title
                            </label>
                            <input
                              id={`edit-title-${book.id}`}
                              name="title"
                              required
                              defaultValue={book.title}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-author-${book.id}`}
                              className="mb-1 block text-sm text-slate-700"
                            >
                              Author
                            </label>
                            <input
                              id={`edit-author-${book.id}`}
                              name="author"
                              required
                              defaultValue={book.author}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-date-${book.id}`}
                              className="mb-1 block text-sm text-slate-700"
                            >
                              วันที่ตีพิมพ์
                            </label>
                            <input
                              id={`edit-date-${book.id}`}
                              name="publishedAt"
                              type="date"
                              required
                              defaultValue={book.publishedAt.slice(0, 10)}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                            />
                          </div>

                          {updateBookError?.bookId === book.id && (
                            <p role="alert" className="text-sm text-red-700">
                              {updateBookError.message}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={updatingBookId === book.id}
                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {updatingBookId === book.id
                              ? "Saving…"
                              : "Save changes"}
                          </button>
                        </form>
                      )}

                      <form
                        className="space-y-3 rounded-lg border border-slate-200 p-4"
                        onSubmit={(event) =>
                          handleCoverUploadSubmit(event, book.id)
                        }
                      >
                        <div>
                          <label
                            htmlFor={`cover-${book.id}`}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            เปลี่ยนรูปปก
                          </label>
                          <input
                            id={`cover-${book.id}`}
                            name="file"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                            className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-400 bg-slate-50 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:border-0 file:border-r file:border-slate-300 file:bg-white file:px-4 file:py-3 file:font-medium file:text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            JPEG, PNG หรือ WebP · ไม่เกิน 5 MB
                          </p>
                        </div>

                        {coverUploadError?.bookId === book.id && (
                          <p role="alert" className="text-sm text-red-700">
                            {coverUploadError.message}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={uploadingBookId === book.id}
                          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {uploadingBookId === book.id
                            ? "Uploading…"
                            : "Upload cover"}
                        </button>
                      </form>
                    </aside>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
