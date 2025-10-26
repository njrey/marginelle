import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/books/$bookId/notes')({
  component: NotesLayout,
})

function NotesLayout() {
  //const parentRoute = getRouteApi('/books/$bookId')
  //const { book } = parentRoute.useLoaderData()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {
          //<h2 className="text-xl font-semibold">Notes for "{book.title}"</h2>
        }
        <nav className="space-x-4">
          {

            // <Link
            //   to="/books/$bookId/notes/new"
            //   params={{ bookId: book.id }}
            //   className="text-blue-600 hover:text-blue-800 underline"
            // >
            //   Create New Note
            // </Link>
            // <Link
            //   to="/books/$bookId/notes/relationships/new"
            //   params={{ bookId: book.id }}
            //   className="text-blue-600 hover:text-blue-800 underline"
            // >
            //   Create Relationship
            // </Link>
          }
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
