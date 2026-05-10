export type UserRole = 'founder' | 'admin'

export interface SessionUser {
  id: string
  email: string
  role: UserRole
}

export interface JwtPayload {
  id: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface AuthResult {
  userId: string
  email: string
  role: UserRole
  token: string
  settings: {
    autonomyLevel: string
    dailyCap: number
  }
}
