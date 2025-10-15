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

export async function getBook(id: string): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch book')
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

// Notes API
export interface Note {
  id: string
  bookId: string
  type: string
  title: string
  content?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreateNoteRequest {
  type: string
  title: string
  content?: string
  metadata?: Record<string, any>
}

export async function getNotes(bookId: string): Promise<Note[]> {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/notes`)
  if (!response.ok) {
    throw new Error('Failed to fetch notes')
  }
  return response.json()
}

export async function getNote(bookId: string, noteId: string): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/notes/${noteId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch note')
  }
  return response.json()
}

export async function createNote(bookId: string, data: CreateNoteRequest): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create note')
  }

  return response.json()
}

// Relationships API
export interface NoteRelationship {
  id: string
  fromNoteId: string
  toNoteId: string
  relationshipType: string
  description?: string
  createdAt: Date
  fromNote: Note
  toNote: Note
}

export interface CreateRelationshipRequest {
  toNoteId: string
  relationshipType: string
  description?: string
}

export const RELATIONSHIP_TYPES = {
  IMPACTS: 'impacts',
  MEMBER_OF: 'member_of',
  ALLY: 'ally',
  ENEMY: 'enemy',
  FAMILY: 'family',
  FRIEND: 'friend',
  OWNS: 'owns',
  LOCATED_IN: 'located_in',
  CAUSES: 'causes',
} as const

export async function getRelationships(bookId: string, noteId: string): Promise<NoteRelationship[]> {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/notes/${noteId}/relationships`)
  if (!response.ok) {
    throw new Error('Failed to fetch relationships')
  }
  return response.json()
}

export async function createRelationship(
  bookId: string,
  noteId: string,
  data: CreateRelationshipRequest
): Promise<NoteRelationship> {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/notes/${noteId}/relationships`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create relationship')
  }

  return response.json()
}

export async function deleteRelationship(
  bookId: string,
  noteId: string,
  relationshipId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/books/${bookId}/notes/${noteId}/relationships/${relationshipId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete relationship')
  }
}