// Crypto utilities for FIDO2 key generation and signing

/**
 * Base64URL encoding/decoding utilities
 */
export const base64url = {
  encode: (buffer) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  },

  decode: (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
};

/**
 * Generate a random credential ID
 */
export const generateCredentialId = () => {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return base64url.encode(buffer);
};

/**
 * Generate RS256 key pair
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export const generateRS256KeyPair = async () => {
  return await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['sign', 'verify']
  );
};

/**
 * Generate ES256 key pair
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export const generateES256KeyPair = async () => {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['sign', 'verify']
  );
};

/**
 * Export key to JWK format
 * @param {CryptoKey} key
 * @returns {Promise<Object>}
 */
export const exportKey = async (key) => {
  return await crypto.subtle.exportKey('jwk', key);
};

/**
 * Import key from JWK format
 * @param {Object} jwk
 * @param {string} algorithm - 'RS256' or 'ES256'
 * @param {string} keyType - 'public' or 'private'
 * @returns {Promise<CryptoKey>}
 */
export const importKey = async (jwk, algorithm, keyType) => {
  const keyUsages = keyType === 'private' ? ['sign'] : ['verify'];

  if (algorithm === 'RS256') {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      keyUsages
    );
  } else if (algorithm === 'ES256') {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      keyUsages
    );
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
};

/**
 * Sign data with private key
 * @param {CryptoKey} privateKey
 * @param {ArrayBuffer} data
 * @param {string} algorithm - 'RS256' or 'ES256'
 * @returns {Promise<ArrayBuffer>}
 */
export const signData = async (privateKey, data, algorithm) => {
  if (algorithm === 'RS256') {
    return await crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      privateKey,
      data
    );
  } else if (algorithm === 'ES256') {
    return await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      privateKey,
      data
    );
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
};

/**
 * Verify signature with public key
 * @param {CryptoKey} publicKey
 * @param {ArrayBuffer} signature
 * @param {ArrayBuffer} data
 * @param {string} algorithm - 'RS256' or 'ES256'
 * @returns {Promise<boolean>}
 */
export const verifySignature = async (publicKey, signature, data, algorithm) => {
  if (algorithm === 'RS256') {
    return await crypto.subtle.verify(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      publicKey,
      signature,
      data
    );
  } else if (algorithm === 'ES256') {
    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signature,
      data
    );
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
};

/**
 * Convert JWK public key to COSE format (for FIDO2)
 * @param {Object} jwk - JWK public key
 * @param {string} algorithm - 'RS256' or 'ES256'
 * @returns {Map} COSE key map (to be CBOR-encoded)
 */
export const jwkToCOSE = (jwk, algorithm) => {
  const coseKey = new Map();

  if (algorithm === 'RS256') {
    // COSE key type: RSA (3)
    // Algorithm: RS256 (-257)
    const n = new Uint8Array(base64url.decode(jwk.n));
    const e = new Uint8Array(base64url.decode(jwk.e));

    // COSE key map for RSA
    coseKey.set(1, 3);      // kty: RSA key type
    coseKey.set(3, -257);   // alg: RS256 algorithm
    coseKey.set(-1, n);     // n: modulus
    coseKey.set(-2, e);     // e: exponent

    return coseKey;
  } else if (algorithm === 'ES256') {
    // COSE key type: EC2 (2)
    // Algorithm: ES256 (-7)
    // Curve: P-256 (1)
    const x = new Uint8Array(base64url.decode(jwk.x));
    const y = new Uint8Array(base64url.decode(jwk.y));

    // COSE key map for EC2
    coseKey.set(1, 2);      // kty: EC2 key type
    coseKey.set(3, -7);     // alg: ES256 algorithm
    coseKey.set(-1, 1);     // crv: P-256 curve
    coseKey.set(-2, x);     // x: x-coordinate
    coseKey.set(-3, y);     // y: y-coordinate

    return coseKey;
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
};
