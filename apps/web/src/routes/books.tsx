import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/books')({
	component: BooksPage,
})

function BooksPage() {
	const { data } = useQuery({
		queryKey: ['books'],
		queryFn: async () => {
			const res = await fetch('http://localhost:3000/api/books') // Nest API
			if (!res.ok) throw new Error('Failed to fetch')
			return res.json() as Promise<Array<{ id: string; title: string }>>
		},
	})
	return (
		<div>
			<h1 className="text-xl font-semibold mb-2">Books</h1>
			<ul className="list-disc pl-6">{data?.map(b => <li key={b.id}>{b.title}</li>)}</ul>
		</div>
	)
}
