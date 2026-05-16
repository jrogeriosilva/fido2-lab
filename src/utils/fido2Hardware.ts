import { base64url } from './crypto'

export const isWebAuthnSupported = (): boolean => {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

interface CreateCredentialOptions {
  challenge: string | ArrayBuffer
  rpId?: string
  rpName?: string
  userId?: string
  userName?: string
  userDisplayName?: string
  timeout?: number
  authenticatorSelection?: Partial<AuthenticatorSelectionCriteria>
}

export const createCredential = async ({
  challenge,
  rpId = window.location.hostname,
  rpName = 'FIDO2 Test Client',
  userId = 'test-user',
  userName = 'testuser@example.com',
  userDisplayName = 'Test User',
  timeout = 60000,
  authenticatorSelection = {},
}: CreateCredentialOptions) => {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn is not supported in this browser')

  let challengeBuffer: ArrayBuffer
  if (typeof challenge === 'string') {
    try {
      challengeBuffer = base64url.decode(challenge)
    } catch {
      challengeBuffer = new TextEncoder().encode(challenge).buffer as ArrayBuffer
    }
  } else {
    challengeBuffer = challenge
  }

  const options: PublicKeyCredentialCreationOptions = {
    challenge: challengeBuffer,
    rp: { name: rpName, id: rpId },
    user: {
      id: new TextEncoder().encode(userId),
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    timeout,
    authenticatorSelection: {
      authenticatorAttachment: authenticatorSelection.authenticatorAttachment ?? 'platform',
      requireResidentKey: authenticatorSelection.requireResidentKey ?? false,
      userVerification: authenticatorSelection.userVerification ?? 'preferred',
    },
    attestation: 'direct',
  }

  const credential = await navigator.credentials.create({ publicKey: options })
  if (!credential) throw new Error('No credential returned')

  const pkCredential = credential as PublicKeyCredential
  const response = pkCredential.response as AuthenticatorAttestationResponse
  const clientDataJSON = new TextDecoder().decode(response.clientDataJSON)

  return {
    id: pkCredential.id,
    rawId: base64url.encode(pkCredential.rawId),
    type: pkCredential.type,
    response: {
      clientDataJSON: base64url.encode(response.clientDataJSON),
      attestationObject: base64url.encode(response.attestationObject),
      clientData: JSON.parse(clientDataJSON),
    },
  }
}

interface GetAssertionOptions {
  challenge: string | ArrayBuffer
  rpId?: string
  credentialId?: string | null
  timeout?: number
  userVerification?: UserVerificationRequirement
}

export const getAssertion = async ({
  challenge,
  rpId = window.location.hostname,
  credentialId = null,
  timeout = 60000,
  userVerification = 'preferred',
}: GetAssertionOptions) => {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn is not supported in this browser')

  let challengeBuffer: ArrayBuffer
  if (typeof challenge === 'string') {
    try {
      challengeBuffer = base64url.decode(challenge)
    } catch {
      challengeBuffer = new TextEncoder().encode(challenge).buffer as ArrayBuffer
    }
  } else {
    challengeBuffer = challenge
  }

  const options: PublicKeyCredentialRequestOptions = {
    challenge: challengeBuffer,
    rpId,
    timeout,
    userVerification,
    ...(credentialId
      ? {
          allowCredentials: [
            { type: 'public-key', id: base64url.decode(credentialId) },
          ],
        }
      : {}),
  }

  const assertion = await navigator.credentials.get({ publicKey: options })
  if (!assertion) throw new Error('No assertion returned')

  const pkAssertion = assertion as PublicKeyCredential
  const response = pkAssertion.response as AuthenticatorAssertionResponse
  const clientDataJSON = new TextDecoder().decode(response.clientDataJSON)

  return {
    id: pkAssertion.id,
    rawId: base64url.encode(pkAssertion.rawId),
    type: pkAssertion.type,
    response: {
      clientDataJSON: base64url.encode(response.clientDataJSON),
      authenticatorData: base64url.encode(response.authenticatorData),
      signature: base64url.encode(response.signature),
      userHandle: response.userHandle ? base64url.encode(response.userHandle) : null,
      clientData: JSON.parse(clientDataJSON),
    },
  }
}

export const parseAlgorithm = (alg: number): string => {
  switch (alg) {
    case -7: return 'ES256'
    case -257: return 'RS256'
    default: return 'Unknown'
  }
}
