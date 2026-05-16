import { decode as cborDecode } from 'cbor-x'
import { base64url } from './crypto'

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('')
}

function parseFlags(flagsByte: number) {
  return {
    UP: !!(flagsByte & 0x01),
    UV: !!(flagsByte & 0x04),
    BE: !!(flagsByte & 0x08),
    BS: !!(flagsByte & 0x10),
    AT: !!(flagsByte & 0x40),
    ED: !!(flagsByte & 0x80),
  }
}

function parseAuthenticatorData(authData: Uint8Array) {
  const dataView = new DataView(authData.buffer, authData.byteOffset, authData.byteLength)
  let offset = 0

  const rpIdHash = new Uint8Array(authData.buffer, authData.byteOffset + offset, 32)
  offset += 32

  const flagsByte = dataView.getUint8(offset)
  const flags = parseFlags(flagsByte)
  offset += 1

  const signCount = dataView.getUint32(offset, false)
  offset += 4

  const result: {
    rpIdHash: string
    flags: ReturnType<typeof parseFlags>
    flagsByte: string
    signCount: number
    attestedCredentialData?: {
      aaguid: string
      credentialIdLength: number
      credentialId: string
      credentialIdBase64url: string
      credentialPublicKey: unknown
    }
    extensions?: unknown
  } = {
    rpIdHash: bytesToHex(rpIdHash),
    flags,
    flagsByte: `0x${flagsByte.toString(16).padStart(2, '0')}`,
    signCount,
  }

  if (flags.AT && offset < authData.length) {
    const aaguid = new Uint8Array(authData.buffer, authData.byteOffset + offset, 16)
    offset += 16

    const credIdLength = dataView.getUint16(offset, false)
    offset += 2

    const credentialId = new Uint8Array(authData.buffer, authData.byteOffset + offset, credIdLength)
    offset += credIdLength

    const publicKeyBytes = new Uint8Array(authData.buffer, authData.byteOffset + offset)
    let credentialPublicKey: unknown
    try {
      credentialPublicKey = cborDecode(publicKeyBytes)
    } catch {
      credentialPublicKey = { error: 'Failed to parse public key CBOR', raw: bytesToHex(publicKeyBytes) }
    }

    result.attestedCredentialData = {
      aaguid: bytesToHex(aaguid),
      credentialIdLength: credIdLength,
      credentialId: bytesToHex(credentialId),
      credentialIdBase64url: base64url.encode(credentialId),
      credentialPublicKey,
    }

    if (typeof credentialPublicKey !== 'object' || (credentialPublicKey as Record<string, unknown>).error) {
      offset = authData.length
    } else {
      offset += publicKeyBytes.length
    }
  }

  if (flags.ED && offset < authData.length) {
    const extensionBytes = new Uint8Array(authData.buffer, authData.byteOffset + offset)
    try {
      result.extensions = cborDecode(extensionBytes)
    } catch {
      result.extensions = { error: 'Failed to parse extensions CBOR', raw: bytesToHex(extensionBytes) }
    }
  }

  return result
}

export function parseAttestationObject(base64urlInput: string) {
  const attestationObjectBytes = new Uint8Array(base64url.decode(base64urlInput))
  const attestationObject = cborDecode(attestationObjectBytes) as {
    fmt: string
    attStmt: unknown
    authData: Uint8Array
  }
  const authData = new Uint8Array(attestationObject.authData)
  const parsedAuthData = parseAuthenticatorData(authData)

  return {
    fmt: attestationObject.fmt,
    attStmt: attestationObject.attStmt,
    authData: parsedAuthData,
    rawAuthData: bytesToHex(authData),
    raw: attestationObject,
  }
}
