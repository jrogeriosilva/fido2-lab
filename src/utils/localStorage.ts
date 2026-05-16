export interface StoredCredential {
  id: string
  type: 'simulated' | 'hardware'
  algorithm: string
  credentialId: string
  publicKeyJWK?: JsonWebKey
  privateKeyJWK?: JsonWebKey
  response?: Record<string, unknown>
  rpId: string
  rpName?: string
  userId: string
  userName?: string
  userDisplayName?: string
  createdAt: string
}

export interface GeneratedKey {
  id: string
  algorithm: string
  publicKey: JsonWebKey
  privateKey: JsonWebKey
  createdAt: string
  used: boolean
}

const STORAGE_KEYS = {
  CREDENTIALS: 'fido2_credentials',
  GENERATED_KEYS: 'fido2_generated_keys',
}

export const getCredentials = (): StoredCredential[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading credentials:', error)
    return []
  }
}

export const saveCredential = (credential: StoredCredential): boolean => {
  try {
    const credentials = getCredentials()
    credentials.push(credential)
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials))
    return true
  } catch (error) {
    console.error('Error saving credential:', error)
    return false
  }
}

export const getCredentialById = (id: string): StoredCredential | null => {
  return getCredentials().find(c => c.id === id) || null
}

export const deleteCredential = (id: string): boolean => {
  try {
    const filtered = getCredentials().filter(c => c.id !== id)
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting credential:', error)
    return false
  }
}

export const clearAllCredentials = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS)
    return true
  } catch (error) {
    console.error('Error clearing credentials:', error)
    return false
  }
}

export const getGeneratedKeys = (): GeneratedKey[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GENERATED_KEYS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading generated keys:', error)
    return []
  }
}

export const saveGeneratedKey = (keyPair: GeneratedKey): boolean => {
  try {
    const keys = getGeneratedKeys()
    keys.push(keyPair)
    localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(keys))
    return true
  } catch (error) {
    console.error('Error saving generated key:', error)
    return false
  }
}

export const getGeneratedKeyById = (id: string): GeneratedKey | null => {
  return getGeneratedKeys().find(k => k.id === id) || null
}

export const markKeyAsUsed = (id: string): boolean => {
  try {
    const keys = getGeneratedKeys()
    const key = keys.find(k => k.id === id)
    if (key) {
      key.used = true
      localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(keys))
      return true
    }
    return false
  } catch (error) {
    console.error('Error marking key as used:', error)
    return false
  }
}

export const deleteGeneratedKey = (id: string): boolean => {
  try {
    const filtered = getGeneratedKeys().filter(k => k.id !== id)
    localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting generated key:', error)
    return false
  }
}

export const clearAllGeneratedKeys = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GENERATED_KEYS)
    return true
  } catch (error) {
    console.error('Error clearing generated keys:', error)
    return false
  }
}

export const exportAllData = () => ({
  credentials: getCredentials(),
  generatedKeys: getGeneratedKeys(),
  exportedAt: new Date().toISOString(),
})

export const importData = (data: { credentials?: StoredCredential[]; generatedKeys?: GeneratedKey[] }): boolean => {
  try {
    if (data.credentials) localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(data.credentials))
    if (data.generatedKeys) localStorage.setItem(STORAGE_KEYS.GENERATED_KEYS, JSON.stringify(data.generatedKeys))
    return true
  } catch (error) {
    console.error('Error importing data:', error)
    return false
  }
}
