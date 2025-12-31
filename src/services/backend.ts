import { ApiClient } from '@/backend/ApiClient'
import type { TokenResult, DeviceRegisterDTO } from '@/backend/ApiClientBase'

export const backend = ApiClient

export function setScannerTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (!token) return null

  backend.deviceTokenResult = { token } as TokenResult
  return token
}

export function clearDeviceAuth() {
  backend.deviceAuthReset()
}

export async function registerDeviceWithToken(token: string, data: DeviceRegisterDTO) {
  return backend.userDeviceRegisterWithToken(token, data)
}
