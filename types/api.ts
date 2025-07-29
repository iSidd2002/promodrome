export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export interface ErrorResponse {
  error: string
  details?: string[]
  code?: string
}
