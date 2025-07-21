export interface User {
  login: string
  role: string
}

export interface Location {
  id: number
  name: string
  longitude: number
  latitude: number
  current_address: string
  historical_address: string
  author: string
  fiction: string
  created_at?: string
}

export interface LocationDescription {
  id: number
  location_id: number
  title: string
  description: string
  created_at?: string
}

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
}

export interface LoginData {
  login: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}