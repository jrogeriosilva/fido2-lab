import { Encoder } from 'cbor-x'
import {
  base64url,
  generateCredentialId,
  generateRS256KeyPair,
  generateES256KeyPair,
  exportKey,
  importKey,
  signData,
  jwkToCOSE,
} from './crypto'
import type { StoredCredential, GeneratedKey } from './localStorage'

const cborEncoder = new Encoder({
  tagUint8Array: false,
  useRecords: false,
  structuredClone: false,
  mapsAsObjects: false,
})

interface AttestedCredData {
  credentialId: Uint8Array
  credentialPublicKey: Uint8Array
}

interface AuthFlags {
  up?: boolean
  uv?: boolean
  at?: boolean
  ed?: boolean
}

const createAuthenticatorData = (
  rpIdHash: ArrayBuffer,
  flags: AuthFlags = {},
  signCount = 0,
  attestedCredData: AttestedCredData | null = null
): Uint8Array => {
  let authDataLength = 37
  if (attestedCredData) {
    authDataLength += 16 + 2 + attestedCredData.credentialId.length + attestedCredData.credentialPublicKey.length
  }

  const authData = new Uint8Array(authDataLength)
  let offset = 0

  authData.set(new Uint8Array(rpIdHash), offset)
  offset += 32

  let flagsByte = 0
  if (flags.up) flagsByte |= 0x01
  if (flags.uv) flagsByte |= 0x04
  if (flags.at) flagsByte |= 0x40
  if (flags.ed) flagsByte |= 0x80
  authData[offset] = flagsByte
  offset += 1

  const countView = new DataView(authData.buffer, offset, 4)
  countView.setUint32(0, signCount, false)
  offset += 4

  if (attestedCredData) {
    authData.set(new Uint8Array(16), offset)
    offset += 16

    const credIdLengthView = new DataView(authData.buffer, offset, 2)
    credIdLengthView.setUint16(0, attestedCredData.credentialId.length, false)
    offset += 2

    authData.set(attestedCredData.credentialId, offset)
    offset += attestedCredData.credentialId.length

    authData.set(attestedCredData.credentialPublicKey, offset)
  }

  return authData
}

const hashRpId = async (rpId: string): Promise<ArrayBuffer> => {
  const data = new TextEncoder().encode(rpId)
  return await crypto.subtle.digest('SHA-256', data)
}

const createClientDataJSON = (
  type: string,
  challenge: string,
  origin = window.location.origin
): string => {
  return JSON.stringify({ type, challenge, origin, crossOrigin: false })
}

interface CreateSimulatedCredentialOptions {
  challenge: string | ArrayBuffer
  algorithm?: string
  rpId?: string
  rpName?: string
  userId?: string
  userName?: string
  userDisplayName?: string
  existingKeyPair?: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null
}

export const createSimulatedCredential = async ({
  challenge,
  algorithm = 'ES256',
  rpId = window.location.hostname,
  rpName = 'FIDO2 Test Client',
  userId = 'test-user',
  userName = 'testuser@example.com',
  userDisplayName = 'Test User',
  existingKeyPair = null,
}: CreateSimulatedCredentialOptions) => {
  let keyPair: CryptoKeyPair
  if (existingKeyPair) {
    keyPair = {
      publicKey: await importKey(existingKeyPair.publicKey, algorithm, 'public'),
      privateKey: await importKey(existingKeyPair.privateKey, algorithm, 'private'),
    }
  } else {
    keyPair = algorithm === 'RS256'
      ? await generateRS256KeyPair()
      : await generateES256KeyPair()
  }

  const publicKeyJWK = await exportKey(keyPair.publicKey)
  const privateKeyJWK = await exportKey(keyPair.privateKey)

  const credentialId = generateCredentialId()
  const credentialIdBytes = new Uint8Array(base64url.decode(credentialId))

  const coseKey = jwkToCOSE(publicKeyJWK, algorithm)
  const coseKeyBytes = new Uint8Array(cborEncoder.encode(coseKey))

  const challengeEncoded = typeof challenge === 'string' ? challenge : base64url.encode(challenge)
  const clientDataJSON = createClientDataJSON('webauthn.create', challengeEncoded)
  const clientDataBuffer = new TextEncoder().encode(clientDataJSON)

  const rpIdHash = await hashRpId(rpId)
  const authenticatorData = createAuthenticatorData(
    rpIdHash,
    { up: true, uv: true, at: true },
    0,
    { credentialId: credentialIdBytes, credentialPublicKey: coseKeyBytes }
  )

  const attestationObjectCBOR = cborEncoder.encode({
    fmt: 'none',
    attStmt: {},
    authData: authenticatorData,
  })

  return {
    id: credentialId,
    rawId: credentialId,
    type: 'public-key',
    algorithm,
    response: {
      clientDataJSON: base64url.encode(clientDataBuffer),
      attestationObject: base64url.encode(attestationObjectCBOR),
      clientData: JSON.parse(clientDataJSON),
    },
    publicKeyJWK,
    privateKeyJWK,
    rpId,
    rpName,
    userId,
    userName,
    userDisplayName,
    createdAt: new Date().toISOString(),
  }
}

interface CreateSimulatedAssertionOptions {
  challenge: string | ArrayBuffer
  credential: StoredCredential
  rpId?: string
  signCount?: number
}

export const createSimulatedAssertion = async ({
  challenge,
  credential,
  rpId = window.location.hostname,
  signCount = 1,
}: CreateSimulatedAssertionOptions) => {
  const privateKey = await importKey(
    credential.privateKeyJWK as JsonWebKey,
    credential.algorithm,
    'private'
  )

  const challengeEncoded = typeof challenge === 'string' ? challenge : base64url.encode(challenge)
  const clientDataJSON = createClientDataJSON('webauthn.get', challengeEncoded)
  const clientDataBuffer = new TextEncoder().encode(clientDataJSON)
  const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataBuffer)

  const rpIdHash = await hashRpId(rpId)
  const authenticatorData = createAuthenticatorData(rpIdHash, { up: true, uv: true }, signCount)

  const signatureBase = new Uint8Array(authenticatorData.length + clientDataHash.byteLength)
  signatureBase.set(authenticatorData, 0)
  signatureBase.set(new Uint8Array(clientDataHash), authenticatorData.length)

  const signature = await signData(privateKey, signatureBase, credential.algorithm)

  return {
    id: credential.id,
    rawId: credential.credentialId,
    type: 'public-key',
    response: {
      clientDataJSON: base64url.encode(clientDataBuffer),
      authenticatorData: base64url.encode(authenticatorData),
      signature: base64url.encode(signature),
      userHandle: base64url.encode(new TextEncoder().encode(credential.userId)),
      clientData: JSON.parse(clientDataJSON),
    },
    algorithm: credential.algorithm,
    credentialId: credential.id,
  }
}

export const generateKeyPairForStorage = async (algorithm = 'ES256'): Promise<GeneratedKey> => {
  const keyPair = algorithm === 'RS256'
    ? await generateRS256KeyPair()
    : await generateES256KeyPair()

  const publicKeyJWK = await exportKey(keyPair.publicKey)
  const privateKeyJWK = await exportKey(keyPair.privateKey)

  return {
    id: generateCredentialId(),
    algorithm,
    publicKey: publicKeyJWK,
    privateKey: privateKeyJWK,
    createdAt: new Date().toISOString(),
    used: false,
  }
}
