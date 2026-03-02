import { useMatches, Link } from "@tanstack/react-router";
import { useStore } from "@livestore/react";
import { queryDb } from "@livestore/livestore";
import { tables, type Book, type Note } from "@/livestore/schema";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment, useMemo } from "react";

type BreadcrumbConfig = {
  label: string | React.ReactNode;
  to?: string;
  params?: Record<string, string>;
};

export function BookBreadcrumbs() {
  const matches = useMatches();
  const { store } = useStore();

  // Get current route and params
  const currentMatch = matches[matches.length - 1];
  const pathname = currentMatch?.pathname || "";
  const routeParams = (currentMatch?.params || {}) as Record<string, string | undefined>;

  const bookId = routeParams.bookId;
  const noteId = routeParams.noteId;

  // Fetch book data (returns empty array if bookId doesn't match)
  // Using a non-existent ID when bookId is undefined ensures empty results
  // Memoized so the query reference is stable between renders
  const resolvedBookId = bookId || "__no_book__";
  const books$ = useMemo(
    () =>
      queryDb(
        () =>
          tables.books.where({
            id: resolvedBookId,
            deletedAt: null,
          }),
        { label: bookId ? `book-${bookId}` : "no-book", deps: resolvedBookId },
      ),
    [resolvedBookId],
  );
  const books = store.useQuery(books$);
  const book = books?.[0] || null;

  // Fetch note data (returns empty array if noteId doesn't match)
  // Using a non-existent ID when noteId is undefined ensures empty results
  // Memoized so the query reference is stable between renders
  const resolvedNoteId = noteId || "__no_note__";
  const notes$ = useMemo(
    () =>
      queryDb(
        () =>
          tables.notes.where({
            id: resolvedNoteId,
            deletedAt: null,
          }),
        { label: noteId ? `note-${noteId}` : "no-note", deps: resolvedNoteId },
      ),
    [resolvedNoteId],
  );
  const notes = store.useQuery(notes$);
  const note = notes?.[0] || null;

  // Build breadcrumb array
  const crumbs = buildBreadcrumbs(pathname, routeParams, book, note);

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList className="text-foreground/80 text-base">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to!} params={crumb.params}>
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function buildBreadcrumbs(
  pathname: string,
  params: Record<string, any>,
  book: Book | null | undefined,
  note: Note | null | undefined,
): BreadcrumbConfig[] {
  const crumbs: BreadcrumbConfig[] = [];
  const { bookId, noteId } = params;

  // 1. Books root (always first, link unless current page)
  if (pathname === "/books/list" || pathname === "/books") {
    crumbs.push({ label: "Books" });
    return crumbs;
  } else {
    crumbs.push({ label: "Books", to: "/books/list" });
  }

  // 2. Create new book
  if (pathname === "/books/new") {
    crumbs.push({ label: "Create New Book" });
    return crumbs;
  }

  // 3. Book detail
  if (bookId) {
    const bookLabel = book ? (
      <span className="inline-block max-w-[200px] truncate align-top" title={book.title}>
        {book.title}
      </span>
    ) : (
      <span className="text-muted-foreground italic">Loading...</span>
    );

    const isBookPage = pathname === `/books/${bookId}` || pathname === `/books/${bookId}/`;

    if (isBookPage) {
      crumbs.push({ label: bookLabel });
      return crumbs;
    } else {
      crumbs.push({
        label: bookLabel,
        to: "/books/$bookId",
        params: { bookId },
      });
    }
  }

  // 4. Notes section
  if (pathname.includes("/notes")) {
    const isNotesListPage =
      pathname === `/books/${bookId}/notes` || pathname === `/books/${bookId}/notes/`;

    if (isNotesListPage) {
      crumbs.push({ label: "Notes" });
      return crumbs;
    } else {
      crumbs.push({
        label: "Notes",
        to: "/books/$bookId/notes",
        params: { bookId: bookId! },
      });
    }
  }

  // 5. Create new note
  if (pathname === `/books/${bookId}/notes/new`) {
    crumbs.push({ label: "Create New Note" });
    return crumbs;
  }

  // 6. Create relationship
  if (pathname === `/books/${bookId}/notes/relationships/new`) {
    crumbs.push({ label: "Create Relationship" });
    return crumbs;
  }

  // 7. Note detail
  if (noteId) {
    const noteLabel = note ? (
      <span className="inline-block max-w-[200px] truncate align-middle" title={note.title}>
        {note.title}
      </span>
    ) : (
      <span className="text-muted-foreground italic">Loading...</span>
    );

    crumbs.push({ label: noteLabel });
    return crumbs;
  }

  return crumbs;
}
