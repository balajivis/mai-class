import { db } from './db.js'
import { logger } from './logger.js'

export async function storeOAuthToken(
  userId: string,
  data: {
    provider: string
    accessToken: string
    refreshToken?: string | null
    expiresAt?: number | null
  }
): Promise<void> {
  await db.oAuthToken.upsert({
    where: { userId_provider: { userId, provider: data.provider } },
    create: {
      userId,
      provider: data.provider,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ? new Date(data.expiresAt * 1000) : null,
    },
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt * 1000) : undefined,
    },
  })
}

export async function getOAuthToken(userId: string, provider: string): Promise<string | null> {
  const token = await db.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider } },
  })

  if (!token) return null

  if (token.expiresAt && token.expiresAt < new Date()) {
    const refreshed = await refreshOAuthToken(userId, provider)
    return refreshed
  }

  return token.accessToken
}

export async function refreshOAuthToken(userId: string, provider: string): Promise<string | null> {
  const token = await db.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider } },
  })

  if (!token?.refreshToken) {
    logger.warn('No refresh token available', { userId, provider })
    return null
  }

  try {
    let tokenUrl: string
    let body: Record<string, string>

    if (provider === 'google') {
      tokenUrl = 'https://oauth2.googleapis.com/token'
      body = {
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: token.refreshToken,
        grant_type: 'refresh_token',
      }
    } else if (provider === 'azure') {
      tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      body = {
        client_id: process.env.AZURE_CLIENT_ID ?? '',
        client_secret: process.env.AZURE_CLIENT_SECRET ?? '',
        refresh_token: token.refreshToken,
        grant_type: 'refresh_token',
        scope: 'openid email profile Mail.Read Calendar.Read',
      }
    } else {
      throw new Error(`Unknown provider: ${provider}`)
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const data = await response.json() as { access_token: string; expires_in: number }

    await db.oAuthToken.update({
      where: { id: token.id },
      data: {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    })

    return data.access_token
  } catch (error) {
    logger.error('OAuth token refresh failed', { userId, provider, error })
    return null
  }
}

export async function isTokenValid(userId: string, provider: string): Promise<boolean> {
  const token = await db.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider } },
  })

  if (!token) return false
  if (!token.expiresAt) return true
  return token.expiresAt > new Date()
}
