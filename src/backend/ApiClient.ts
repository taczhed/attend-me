import { dateReviver } from '../utils/JsonHelpers.ts'
import { ApiClientBase, TokenResult, User, DeviceRegisterDTO } from './ApiClientBase.ts'

export class Api extends ApiClientBase {
  userTokenResult?: TokenResult
  deviceTokenResult?: TokenResult
  onUnauthorized?: (url: string) => void

  constructor(url: string) {
    const http: unknown = { fetch: null }

    super(url, http as ApiHttpClient)
    ;(http as ApiHttpClient).fetch = this.fetchWrapper.bind(this)

    this.jsonParseReviver = dateReviver

    this.restoreTokens()
  }

  /**
   * Restores token from storage
   */
  restoreTokens() {
    const rawDeviceAuth = window.localStorage.getItem('attend-me:device-auth')
    if (rawDeviceAuth) {
      this.deviceTokenResult = JSON.parse(rawDeviceAuth, dateReviver)
    }

    const rawUserAuth = window.sessionStorage.getItem('attend-me:user-auth')
    if (rawUserAuth) {
      this.userTokenResult = JSON.parse(rawUserAuth, dateReviver)
    }
  }

  override async userLogin(loginName: string, password: string): Promise<TokenResult> {
    const result = await super.userLogin(loginName, password)

    if (!result || !result.token) throw new Error('User token not found!')

    this.userTokenResult = result
    window.sessionStorage.setItem('attend-me:user-auth', JSON.stringify(result))

    return result
  }

  override async userGet(userId?: number): Promise<User> {
    return await super.userGet(userId)
  }

  userLogout() {
    this.userTokenResult = undefined
    window.sessionStorage.removeItem('attend-me:user-auth')
  }

  private fetchWrapper(requestInfo: RequestInfo, init?: RequestInit): Promise<Response> {
    const opts: RequestInit = { ...init }
    const requestUrl = typeof requestInfo === 'string' ? requestInfo : requestInfo.url
    const parsedUrl = new URL(requestUrl)
    const path = parsedUrl.pathname
    const userEndpoint = !path.startsWith('/user/login')
    const deviceEndpoint =
      (path.startsWith('/user/device/register') ||
        path.startsWith('/user/attendance/ticket/get') ||
        path.startsWith('/course/session/attendance/register')) &&
      !path.startsWith('/user/device/register/token/get')

    if (this.deviceTokenResult && deviceEndpoint) {
      opts.headers = { ...opts.headers, Authorization: `Bearer ${this.deviceTokenResult.token}` }
    } else if (this.userTokenResult && userEndpoint) {
      opts.headers = { ...opts.headers, Authorization: `Bearer ${this.userTokenResult.token}` }
    }

    const request = fetch(requestInfo, opts)

    if (this.onUnauthorized) {
      return request.then((response) => {
        if (response.status === 401 && this.onUnauthorized) this.onUnauthorized(requestUrl)
        return response
      })
    }

    return request
  }

  deviceAuthReset() {
    this.deviceTokenResult = undefined
    window.localStorage.removeItem('attend-me:device-auth')
  }

  userDeviceRegisterWithToken(token: string, data: DeviceRegisterDTO): Promise<TokenResult> {
    this.deviceTokenResult = new TokenResult({ token })
    return super.userDeviceRegister(data).then((result) => {
      this.deviceTokenResult = result
      window.localStorage.setItem('attend-me:device-auth', JSON.stringify(result))

      return result
    })
  }
}

type ApiHttpClient = {
  fetch(url: RequestInfo, init?: RequestInit): Promise<Response>
}

export const ApiClient = new Api('https://attendme-backend.runasp.net')
