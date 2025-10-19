import { decode as cborDecode } from 'cbor-x';
import { base64url } from './crypto';

/**
 * Converts a byte array to a hexadecimal string
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Parses the flags byte from authenticator data
 */
function parseFlags(flagsByte) {
  return {
    UP: !!(flagsByte & 0x01), // User Present
    UV: !!(flagsByte & 0x04), // User Verified
    BE: !!(flagsByte & 0x08), // Backup Eligible
    BS: !!(flagsByte & 0x10), // Backup State
    AT: !!(flagsByte & 0x40), // Attested credential data included
    ED: !!(flagsByte & 0x80), // Extension data included
  };
}

/**
 * Parses the authenticator data structure
 */
function parseAuthenticatorData(authData) {
  const dataView = new DataView(authData.buffer, authData.byteOffset, authData.byteLength);
  let offset = 0;

  // RP ID Hash (32 bytes)
  const rpIdHash = new Uint8Array(authData.buffer, authData.byteOffset + offset, 32);
  offset += 32;

  // Flags (1 byte)
  const flagsByte = dataView.getUint8(offset);
  const flags = parseFlags(flagsByte);
  offset += 1;

  // Sign Count (4 bytes, big-endian)
  const signCount = dataView.getUint32(offset, false);
  offset += 4;

  const result = {
    rpIdHash: bytesToHex(rpIdHash),
    flags,
    flagsByte: `0x${flagsByte.toString(16).padStart(2, '0')}`,
    signCount,
  };

  // Attested Credential Data (if AT flag is set)
  if (flags.AT && offset < authData.length) {
    // AAGUID (16 bytes)
    const aaguid = new Uint8Array(authData.buffer, authData.byteOffset + offset, 16);
    offset += 16;

    // Credential ID Length (2 bytes, big-endian)
    const credIdLength = dataView.getUint16(offset, false);
    offset += 2;

    // Credential ID
    const credentialId = new Uint8Array(authData.buffer, authData.byteOffset + offset, credIdLength);
    offset += credIdLength;

    // Credential Public Key (CBOR-encoded)
    const publicKeyBytes = new Uint8Array(authData.buffer, authData.byteOffset + offset);
    let credentialPublicKey;
    try {
      credentialPublicKey = cborDecode(publicKeyBytes);
    } catch {
      credentialPublicKey = { error: 'Failed to parse public key CBOR', raw: bytesToHex(publicKeyBytes) };
    }

    result.attestedCredentialData = {
      aaguid: bytesToHex(aaguid),
      credentialIdLength: credIdLength,
      credentialId: bytesToHex(credentialId),
      credentialIdBase64url: base64url.encode(credentialId),
      credentialPublicKey,
    };

    // Update offset for potential extensions
    if (typeof credentialPublicKey !== 'object' || credentialPublicKey.error) {
      // If we couldn't parse the public key, we can't determine the exact offset
      offset = authData.length;
    } else {
      // Calculate the actual bytes consumed by CBOR encoding
      // This is approximate - in production you'd want more robust parsing
      offset += publicKeyBytes.length;
    }
  }

  // Extension data (if ED flag is set)
  if (flags.ED && offset < authData.length) {
    const extensionBytes = new Uint8Array(authData.buffer, authData.byteOffset + offset);
    try {
      result.extensions = cborDecode(extensionBytes);
    } catch {
      result.extensions = { error: 'Failed to parse extensions CBOR', raw: bytesToHex(extensionBytes) };
    }
  }

  return result;
}

/**
 * Parses a base64url-encoded attestationObject
 * @param {string} base64urlInput - The base64url-encoded attestationObject
 * @returns {object} Parsed attestationObject with decoded fields
 */
export function parseAttestationObject(base64urlInput) {
  // Step 1: Decode base64url to bytes
  const attestationObjectBuffer = base64url.decode(base64urlInput);
  // Convert ArrayBuffer to Uint8Array for cbor-x
  const attestationObjectBytes = new Uint8Array(attestationObjectBuffer);

  // Step 2: Parse CBOR structure
  const attestationObject = cborDecode(attestationObjectBytes);

  // Step 3: Parse authenticator data
  const authData = new Uint8Array(attestationObject.authData);
  const parsedAuthData = parseAuthenticatorData(authData);

  // Step 4: Return structured result
  return {
    fmt: attestationObject.fmt,
    attStmt: attestationObject.attStmt,
    authData: parsedAuthData,
    rawAuthData: bytesToHex(authData),
    raw: attestationObject,
  };
}
