// FIDO2 Hardware API wrapper using navigator.credentials

import { base64url } from './crypto.js';

/**
 * Check if WebAuthn is supported
 * @returns {boolean}
 */
export const isWebAuthnSupported = () => {
  return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
};

/**
 * Create a new credential using hardware authenticator
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const createCredential = async ({
  challenge,
  rpId = window.location.hostname,
  rpName = 'FIDO2 Test Client',
  userId = 'test-user',
  userName = 'testuser@example.com',
  userDisplayName = 'Test User',
  timeout = 60000,
  authenticatorSelection = {}
}) => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Convert challenge to Uint8Array if it's a string
  let challengeBuffer;
  if (typeof challenge === 'string') {
    try {
      challengeBuffer = base64url.decode(challenge);
    } catch (e) {
      // If not base64url, convert string directly
      const encoder = new TextEncoder();
      challengeBuffer = encoder.encode(challenge);
    }
  } else {
    challengeBuffer = challenge;
  }

  // Convert userId to Uint8Array
  const encoder = new TextEncoder();
  const userIdBuffer = encoder.encode(userId);

  const publicKeyCredentialCreationOptions = {
    challenge: challengeBuffer,
    rp: {
      name: rpName,
      id: rpId
    },
    user: {
      id: userIdBuffer,
      name: userName,
      displayName: userDisplayName
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7 // ES256
      },
      {
        type: 'public-key',
        alg: -257 // RS256
      }
    ],
    timeout,
    authenticatorSelection: {
      authenticatorAttachment: authenticatorSelection.authenticatorAttachment || 'platform',
      requireResidentKey: authenticatorSelection.requireResidentKey || false,
      userVerification: authenticatorSelection.userVerification || 'preferred'
    },
    attestation: 'direct'
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });

    // Parse the credential response
    const response = credential.response;
    const clientDataJSON = new TextDecoder().decode(response.clientDataJSON);
    const attestationObject = response.attestationObject;

    return {
      id: credential.id,
      rawId: base64url.encode(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: base64url.encode(response.clientDataJSON),
        attestationObject: base64url.encode(attestationObject),
        clientData: JSON.parse(clientDataJSON)
      }
    };
  } catch (error) {
    console.error('Error creating credential:', error);
    throw error;
  }
};

/**
 * Get/Sign with an existing credential using hardware authenticator
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const getAssertion = async ({
  challenge,
  rpId = window.location.hostname,
  credentialId = null,
  timeout = 60000,
  userVerification = 'preferred'
}) => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Convert challenge to Uint8Array if it's a string
  let challengeBuffer;
  if (typeof challenge === 'string') {
    try {
      challengeBuffer = base64url.decode(challenge);
    } catch (e) {
      // If not base64url, convert string directly
      const encoder = new TextEncoder();
      challengeBuffer = encoder.encode(challenge);
    }
  } else {
    challengeBuffer = challenge;
  }

  const publicKeyCredentialRequestOptions = {
    challenge: challengeBuffer,
    rpId,
    timeout,
    userVerification
  };

  // If specific credential ID is provided, only allow that one
  if (credentialId) {
    publicKeyCredentialRequestOptions.allowCredentials = [
      {
        type: 'public-key',
        id: base64url.decode(credentialId)
      }
    ];
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    // Parse the assertion response
    const response = assertion.response;
    const clientDataJSON = new TextDecoder().decode(response.clientDataJSON);

    return {
      id: assertion.id,
      rawId: base64url.encode(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: base64url.encode(response.clientDataJSON),
        authenticatorData: base64url.encode(response.authenticatorData),
        signature: base64url.encode(response.signature),
        userHandle: response.userHandle ? base64url.encode(response.userHandle) : null,
        clientData: JSON.parse(clientDataJSON)
      }
    };
  } catch (error) {
    console.error('Error getting assertion:', error);
    throw error;
  }
};

/**
 * Parse algorithm from COSE algorithm identifier
 * @param {number} alg - COSE algorithm identifier
 * @returns {string}
 */
export const parseAlgorithm = (alg) => {
  switch (alg) {
    case -7:
      return 'ES256';
    case -257:
      return 'RS256';
    default:
      return 'Unknown';
  }
};
