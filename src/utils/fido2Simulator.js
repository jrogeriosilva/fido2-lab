// FIDO2 Simulator - Create simulated credentials without hardware

import { Encoder } from 'cbor-x';
import {
  base64url,
  generateCredentialId,
  generateRS256KeyPair,
  generateES256KeyPair,
  exportKey,
  importKey,
  signData,
  jwkToCOSE
} from './crypto.js';

// Create CBOR encoder without tags for FIDO2 compatibility
const cborEncoder = new Encoder({
  tagUint8Array: false,
  useRecords: false,
  structuredClone: false,
  mapsAsObjects: false
});

/**
 * Create authenticator data
 * @param {ArrayBuffer} rpIdHash - SHA-256 hash of RP ID
 * @param {Object} flags
 * @param {number} signCount
 * @param {Object} attestedCredData - Optional attested credential data
 * @returns {Uint8Array}
 */
const createAuthenticatorData = (rpIdHash, flags = {}, signCount = 0, attestedCredData = null) => {
  // Base authenticator data is 37 bytes (32 + 1 + 4)
  let authDataLength = 37;

  // If attested credential data is included, calculate total length
  if (attestedCredData) {
    // AAGUID (16) + credIdLength (2) + credId + CBOR public key
    authDataLength += 16 + 2 + attestedCredData.credentialId.length + attestedCredData.credentialPublicKey.length;
  }

  const authData = new Uint8Array(authDataLength);
  let offset = 0;

  // RP ID hash (32 bytes)
  authData.set(new Uint8Array(rpIdHash), offset);
  offset += 32;

  // Flags (1 byte)
  let flagsByte = 0;
  if (flags.up) flagsByte |= 0x01; // User Present
  if (flags.uv) flagsByte |= 0x04; // User Verified
  if (flags.at) flagsByte |= 0x40; // Attested credential data included
  if (flags.ed) flagsByte |= 0x80; // Extension data included
  authData[offset] = flagsByte;
  offset += 1;

  // Sign count (4 bytes, big-endian)
  const countView = new DataView(authData.buffer, offset, 4);
  countView.setUint32(0, signCount, false);
  offset += 4;

  // Attested credential data (if present)
  if (attestedCredData) {
    // AAGUID (16 bytes) - all zeros for simulated authenticator
    const aaguid = new Uint8Array(16);
    authData.set(aaguid, offset);
    offset += 16;

    // Credential ID length (2 bytes, big-endian)
    const credIdLengthView = new DataView(authData.buffer, offset, 2);
    credIdLengthView.setUint16(0, attestedCredData.credentialId.length, false);
    offset += 2;

    // Credential ID
    authData.set(attestedCredData.credentialId, offset);
    offset += attestedCredData.credentialId.length;

    // Credential public key (CBOR-encoded COSE key)
    authData.set(attestedCredData.credentialPublicKey, offset);
  }

  return authData;
};

/**
 * Hash RP ID
 * @param {string} rpId
 * @returns {Promise<ArrayBuffer>}
 */
const hashRpId = async (rpId) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(rpId);
  return await crypto.subtle.digest('SHA-256', data);
};

/**
 * Create client data JSON
 * @param {string} type - 'webauthn.create' or 'webauthn.get'
 * @param {string} challenge
 * @param {string} origin
 * @returns {string}
 */
const createClientDataJSON = (type, challenge, origin = window.location.origin) => {
  return JSON.stringify({
    type,
    challenge,
    origin,
    crossOrigin: false
  });
};

/**
 * Create a simulated FIDO2 credential
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const createSimulatedCredential = async ({
  challenge,
  algorithm = 'ES256',
  rpId = window.location.hostname,
  rpName = 'FIDO2 Test Client',
  userId = 'test-user',
  userName = 'testuser@example.com',
  userDisplayName = 'Test User',
  existingKeyPair = null // Optional: use pre-generated key pair
}) => {
  try {
    // Generate or use existing key pair
    let keyPair;
    if (existingKeyPair) {
      // Import existing key pair
      keyPair = {
        publicKey: await importKey(existingKeyPair.publicKey, algorithm, 'public'),
        privateKey: await importKey(existingKeyPair.privateKey, algorithm, 'private')
      };
    } else {
      // Generate new key pair
      if (algorithm === 'RS256') {
        keyPair = await generateRS256KeyPair();
      } else if (algorithm === 'ES256') {
        keyPair = await generateES256KeyPair();
      } else {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }
    }

    // Export keys
    const publicKeyJWK = await exportKey(keyPair.publicKey);
    const privateKeyJWK = await exportKey(keyPair.privateKey);

    // Generate credential ID
    const credentialId = generateCredentialId();
    const credentialIdBytes = new Uint8Array(base64url.decode(credentialId));

    // Convert public key to COSE format
    const coseKey = jwkToCOSE(publicKeyJWK, algorithm);
    const coseKeyBytes = new Uint8Array(cborEncoder.encode(coseKey));

    // Create client data JSON
    const challengeEncoded = typeof challenge === 'string' ? challenge : base64url.encode(challenge);
    const clientDataJSON = createClientDataJSON('webauthn.create', challengeEncoded);
    const clientDataBuffer = new TextEncoder().encode(clientDataJSON);

    // Hash RP ID
    const rpIdHash = await hashRpId(rpId);

    // Create authenticator data with attested credential data
    const authenticatorData = createAuthenticatorData(rpIdHash, {
      up: true, // User present
      uv: true, // User verified
      at: true  // Attested credential data
    }, 0, {
      credentialId: credentialIdBytes,
      credentialPublicKey: coseKeyBytes
    });

    // Create attestation object (CBOR-encoded)
    // CBOR object with proper structure for FIDO2
    const attestationObject = {
      fmt: 'none',
      attStmt: {},
      authData: authenticatorData
    };

    // CBOR-encode the attestation object
    const attestationObjectCBOR = cborEncoder.encode(attestationObject);

    return {
      id: credentialId,
      rawId: credentialId,
      type: 'public-key',
      algorithm,
      response: {
        clientDataJSON: base64url.encode(clientDataBuffer),
        attestationObject: base64url.encode(attestationObjectCBOR),
        clientData: JSON.parse(clientDataJSON)
      },
      // Store keys for later signing
      publicKeyJWK,
      privateKeyJWK,
      // Metadata
      rpId,
      rpName,
      userId,
      userName,
      userDisplayName,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating simulated credential:', error);
    throw error;
  }
};

/**
 * Create a simulated FIDO2 assertion (signature)
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const createSimulatedAssertion = async ({
  challenge,
  credential,
  rpId = window.location.hostname,
  signCount = 1
}) => {
  try {
    // Import private key
    const privateKey = await importKey(
      credential.privateKeyJWK,
      credential.algorithm,
      'private'
    );

    // Create client data JSON
    const challengeEncoded = typeof challenge === 'string' ? challenge : base64url.encode(challenge);
    const clientDataJSON = createClientDataJSON('webauthn.get', challengeEncoded);
    const clientDataBuffer = new TextEncoder().encode(clientDataJSON);

    // Hash client data
    const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataBuffer);

    // Hash RP ID
    const rpIdHash = await hashRpId(rpId);

    // Create authenticator data
    const authenticatorData = createAuthenticatorData(rpIdHash, {
      up: true, // User present
      uv: true  // User verified
    }, signCount);

    // Create signature base (authenticatorData + clientDataHash)
    const signatureBase = new Uint8Array(authenticatorData.length + clientDataHash.byteLength);
    signatureBase.set(authenticatorData, 0);
    signatureBase.set(new Uint8Array(clientDataHash), authenticatorData.length);

    // Sign the data
    const signature = await signData(privateKey, signatureBase, credential.algorithm);

    // Return assertion
    return {
      id: credential.id,
      rawId: credential.rawId,
      type: 'public-key',
      response: {
        clientDataJSON: base64url.encode(clientDataBuffer),
        authenticatorData: base64url.encode(authenticatorData),
        signature: base64url.encode(signature),
        userHandle: base64url.encode(new TextEncoder().encode(credential.userId)),
        clientData: JSON.parse(clientDataJSON)
      },
      // Additional info
      algorithm: credential.algorithm,
      credentialId: credential.id
    };
  } catch (error) {
    console.error('Error creating simulated assertion:', error);
    throw error;
  }
};

/**
 * Generate a key pair for later use
 * @param {string} algorithm - 'RS256' or 'ES256'
 * @returns {Promise<Object>}
 */
export const generateKeyPairForStorage = async (algorithm = 'ES256') => {
  try {
    let keyPair;
    if (algorithm === 'RS256') {
      keyPair = await generateRS256KeyPair();
    } else if (algorithm === 'ES256') {
      keyPair = await generateES256KeyPair();
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const publicKeyJWK = await exportKey(keyPair.publicKey);
    const privateKeyJWK = await exportKey(keyPair.privateKey);

    return {
      id: generateCredentialId(),
      algorithm,
      publicKey: publicKeyJWK,
      privateKey: privateKeyJWK,
      createdAt: new Date().toISOString(),
      used: false
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
};
