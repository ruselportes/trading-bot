import CryptoJS from 'crypto-js'

export function signOKXRequest(
  apiKey: string,
  secret: string,
  passphrase: string,
  method: string,
  path: string,
  body?: string,
): { headers: Record<string, string> } {
  const timestamp = new Date().toISOString()
  const message = timestamp + method + path + (body || '')
  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(message, secret),
  )

  return {
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
    },
  }
}

export function signOKXWSLogin(
  apiKey: string,
  secret: string,
  passphrase: string,
): { op: string; args: { apiKey: string; passphrase: string; timestamp: string; sign: string }[] } {
  const timestamp = new Date().toISOString()
  const message = timestamp + 'GET' + '/users/self/verify'
  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(message, secret),
  )

  return {
    op: 'login',
    args: [
      {
        apiKey,
        passphrase,
        timestamp,
        sign: signature,
      },
    ],
  }
}
