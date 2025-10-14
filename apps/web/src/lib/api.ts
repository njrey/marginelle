const API_BASE_URL = 'http://localhost:3000/api'

export interface Book {
  id: string
  title: string
  author?: string
  createdAt: Date
}

export interface CreateBookRequest {
  title: string
  author?: string
}

export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`)
  if (!response.ok) {
    throw new Error('Failed to fetch books')
  }
  return response.json()
}

export async function createBook(data: CreateBookRequest): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create book')
  }

  return response.json()
}