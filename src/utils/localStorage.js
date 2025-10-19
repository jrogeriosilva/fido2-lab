// LocalStorage management for FIDO2 credentials

const STORAGE_KEYS = {
  CREDENTIALS: 'fido2_credentials',
  GENERATED_KEYS: 'fido2_generated_keys'
};

/**
 * Get all stored credentials
 * @returns {Array}
 */
export const getCredentials = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading credentials:', error);
    return [];
  }
};

/**
 * Save a new credential
 * @param {Object} credential
 */
export const saveCredential = (credential) => {
  try {
    const credentials = getCredentials();
    credentials.push(credential);
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    return true;
  } catch (error) {
    console.error('Error saving credential:', error);
    return false;
  }
};

/**
 * Get credential by ID
 * @param {string} id
 * @returns {Object|null}
 */
export const getCredentialById = (id) => {
  const credentials = getCredentials();
  return credentials.find(cred => cred.id === id) || null;
};

/**
 * Delete credential by ID
 * @param {string} id
 */
export const deleteCredential = (id) => {
  try {
    const credentials = getCredentials();
    const filtered = credentials.filter(cred => cred.id !== id);
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting credential:', error);
    return false;
  }
};

/**
 * Clear all credentials
 */
export const clearAllCredentials = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    return true;
  } catch (error) {
    console.error('Error clearing credentials:', error);
    return false;
  }
};

/**
 * Get all generated keys
 * @returns {Array}
 */
export const getGeneratedKeys = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GENERATED_KEYS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading generated keys:', error);
    return [];
  }
};

/**
 * Save a new generated key pair
 * @param {Object} keyPair
 */
export const saveGeneratedKey = (keyPair) => {
  try {
    const keys = getGeneratedKeys();
    keys.push(keyPair);
    localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(keys));
    return true;
  } catch (error) {
    console.error('Error saving generated key:', error);
    return false;
  }
};

/**
 * Get generated key by ID
 * @param {string} id
 * @returns {Object|null}
 */
export const getGeneratedKeyById = (id) => {
  const keys = getGeneratedKeys();
  return keys.find(key => key.id === id) || null;
};

/**
 * Mark a generated key as used
 * @param {string} id
 */
export const markKeyAsUsed = (id) => {
  try {
    const keys = getGeneratedKeys();
    const key = keys.find(k => k.id === id);
    if (key) {
      key.used = true;
      localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(keys));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking key as used:', error);
    return false;
  }
};

/**
 * Delete generated key by ID
 * @param {string} id
 */
export const deleteGeneratedKey = (id) => {
  try {
    const keys = getGeneratedKeys();
    const filtered = keys.filter(key => key.id !== id);
    localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting generated key:', error);
    return false;
  }
};

/**
 * Clear all generated keys
 */
export const clearAllGeneratedKeys = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GENERATED_KEYS);
    return true;
  } catch (error) {
    console.error('Error clearing generated keys:', error);
    return false;
  }
};

/**
 * Export all data as JSON
 * @returns {Object}
 */
export const exportAllData = () => {
  return {
    credentials: getCredentials(),
    generatedKeys: getGeneratedKeys(),
    exportedAt: new Date().toISOString()
  };
};

/**
 * Import data from JSON
 * @param {Object} data
 */
export const importData = (data) => {
  try {
    if (data.credentials) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(data.credentials));
    }
    if (data.generatedKeys) {
      localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(data.generatedKeys));
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
