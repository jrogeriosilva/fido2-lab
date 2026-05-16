export const base64url = {
  encode: (buffer: ArrayBuffer | Uint8Array): string => {
    const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    const base64 = btoa(String.fromCharCode(...arr))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  },

  decode: (str: string): ArrayBuffer => {
    let s = str.replace(/-/g, '+').replace(/_/g, '/')
    while (s.length % 4) s += '='
    const binary = atob(s)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer as ArrayBuffer
  },
}

export const generateCredentialId = (): string => {
  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return base64url.encode(buffer)
}

export const generateRS256KeyPair = async (): Promise<CryptoKeyPair> => {
  return await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  ) as CryptoKeyPair
}

export const generateES256KeyPair = async (): Promise<CryptoKeyPair> => {
  return await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  ) as CryptoKeyPair
}

export const exportKey = async (key: CryptoKey): Promise<JsonWebKey> => {
  return await crypto.subtle.exportKey('jwk', key)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subtleImportKey = crypto.subtle.importKey.bind(crypto.subtle) as any

export const importKey = async (
  jwk: JsonWebKey,
  algorithm: string,
  keyType: 'public' | 'private'
): Promise<CryptoKey> => {
  const keyUsages: KeyUsage[] = keyType === 'private' ? ['sign'] : ['verify']

  if (algorithm === 'RS256') {
    return await subtleImportKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, true, keyUsages)
  } else if (algorithm === 'ES256') {
    return await subtleImportKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, keyUsages)
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`)
}

export const signData = async (
  privateKey: CryptoKey,
  data: ArrayBuffer | Uint8Array,
  algorithm: string
): Promise<ArrayBuffer> => {
  const buf = data instanceof Uint8Array ? data.buffer as ArrayBuffer : data
  if (algorithm === 'RS256') {
    return await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, buf)
  } else if (algorithm === 'ES256') {
    return await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, buf)
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`)
}

export const verifySignature = async (
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  data: ArrayBuffer,
  algorithm: string
): Promise<boolean> => {
  if (algorithm === 'RS256') {
    return await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, publicKey, signature, data)
  } else if (algorithm === 'ES256') {
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, signature, data)
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`)
}

export const jwkToCOSE = (jwk: JsonWebKey, algorithm: string): Map<number, unknown> => {
  const coseKey = new Map<number, unknown>()

  if (algorithm === 'RS256') {
    const n = new Uint8Array(base64url.decode(jwk.n!))
    const e = new Uint8Array(base64url.decode(jwk.e!))
    coseKey.set(1, 3); coseKey.set(3, -257); coseKey.set(-1, n); coseKey.set(-2, e)
    return coseKey
  } else if (algorithm === 'ES256') {
    const x = new Uint8Array(base64url.decode(jwk.x!))
    const y = new Uint8Array(base64url.decode(jwk.y!))
    coseKey.set(1, 2); coseKey.set(3, -7); coseKey.set(-1, 1); coseKey.set(-2, x); coseKey.set(-3, y)
    return coseKey
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`)
}
