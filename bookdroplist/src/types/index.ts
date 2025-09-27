export interface Book {
  id: string
  title: string
  author?: string
  cover_url?: string
  isbn?: string
  publication_year?: number
  genre?: string
  description?: string
  publisher?: string
}

export interface Location {
  latitude: number
  longitude: number
  name?: string
  city?: string
  country?: string
}

export type ListPurpose = 'sharing' | 'pickup' | 'borrowing' | 'buying' | 'searching' | 'minilibrary'

export interface BookList {
  id: string
  name: string
  description?: string
  share_url: string
  created_at: string
  updated_at?: string
  purpose?: ListPurpose
  // Only public (fuzzy) location is exposed for most purposes
  // For mini libraries, exact location is shown
  public_latitude?: number
  public_longitude?: number
  exact_latitude?: number
  exact_longitude?: number
  location_name?: string
  city?: string
  country?: string
  books: Book[]
  isOwner?: boolean
  isManager?: boolean
  canEdit?: boolean
}

export interface ListBook {
  list_id: string
  book_id: string
  position: number
}