import { createFileRoute } from '@tanstack/react-router'
import { BookAnimation } from '../components/BookAnimation'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <BookAnimation />
}
